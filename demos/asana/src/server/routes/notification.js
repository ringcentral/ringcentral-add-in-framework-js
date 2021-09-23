const axios = require('axios');
const { Subscription } = require('../models/subscriptionModel');
const { User } = require('../models/userModel');
const { getOAuthApp, checkAndRefreshAccessToken } = require('../lib/oauth');
const constants = require('../lib/constants');
const crypto = require('crypto');
const { getAuthCard, getAsanaTaskCard } = require('../lib/adaptiveCard');
const Asana = require('asana');



async function notification(req, res) {
  try {
    console.log(`Receiving notification: ${JSON.stringify(req.body, null, 2)}`);
    // Identify which user or subscription is relevant, normally by 3rd party webhook id or user id. 
    const subscriptionId = req.query.subscriptionId;
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      res.status(403);
      res.send('Unknown subscription id');
      return;
    }
    const incomingEvents = req.body.events;
    if (incomingEvents) {
      // check token refresh condition
      const userId = subscription.userId;
      const user = await User.findByPk(userId);
      await checkAndRefreshAccessToken(user);
      // Step.1: Extract info from 3rd party notification POST body
      // Asana events don't contain the actual change, we'll just get resource here then fetch the change ourselves
      const event = req.body.events[0];

      // Step.2(optional): Filter out notifications that user is not interested in, some platform may not have a build-in filtering mechanism.  
      const client = Asana.Client.create().useAccessToken(user.accessToken);
      // get info
      const userChangedTask = await client.users.findById(event.user.gid);
      const taskChanged = await client.tasks.findById(event.resource.gid);
      const username = userChangedTask.name;
      const userEmail = userChangedTask.email;
      const taskName = taskChanged.name;
      const taskUrl = taskChanged.permalink_url;
      const taskGid = taskChanged.gid;

      // Step.3: Transform notification info into RingCentral App adaptive card - design your own adaptive card: https://adaptivecards.io/designer/
      const card = getAsanaTaskCard({
        username: username,
        userEmail: userEmail,
        taskName: taskName,
        taskUrl: taskUrl,
        taskGid: taskGid,
        subscriptionId: subscriptionId
      })

      // Send adaptive card to your channel in RingCentral App
      console.log(`[DEBUG]Adaptive card:\n ${JSON.stringify(card, null, 2)}`);
      await sendAdaptiveCardMessage(subscription.rcWebhookUri, card);
    }
  } catch (e) {
    console.error(e);
  }

  // required by Asana for handshake (https://developers.asana.com/docs/webhooks)
  if (req.headers['x-hook-secret']) {
    res.header('X-Hook-Secret', req.headers['x-hook-secret']);
  }

  res.status(200);
  res.json({
    result: 'OK',
  });
}


async function interactiveMessages(req, res) {
  // Shared secret can be found on RingCentral developer portal, under your app Settings
  const SHARED_SECRET = process.env.IM_SHARED_SECRET;
  if (SHARED_SECRET) {
    const signature = req.get('X-Glip-Signature', 'sha1=');
    const encryptedBody =
      crypto.createHmac('sha1', SHARED_SECRET).update(JSON.stringify(req.body)).digest('hex');
    if (encryptedBody !== signature) {
      res.status(401).send();
      return;
    }
  }
  const body = req.body;
  console.log(`Incoming interactive message: ${JSON.stringify(body, null, 2)}`);
  if (!body.data || !body.user) {
    res.status(400);
    res.send('Params error');
    return;
  }
  const subscriptionId = body.data.subscriptionId;
  const subscription = await Subscription.findByPk(subscriptionId);
  if (!subscription) {
    res.status(404);
    res.send('Not found');
    return;
  }
  const oauth = getOAuthApp();
  let user = await User.findOne({ where: { rcUserId: body.user.id } });
  let asanaClient;
  const action = body.data.action;
  if (action === 'authorize') {
    const buff = Buffer.from(body.data.token, 'base64');
    const authQuery = buff.toString('ascii');
    let token;
    try {
      // same call as 3rd party auth callback to return accessCode to exchange for accessToken
      const callbackUri = `${process.env.APP_SERVER}${constants.route.forThirdParty.AUTH_CALLBACK}${authQuery}`;
      token = await oauth.code.getToken(callbackUri);
    } catch (e) {
      console.error('Get token error');
      await sendTextMessage(subscription.rcWebhookUri, `Hi ${body.user.firstName} ${body.user.lastName}, the token is invalid.`)
      res.status(200);
      res.send('ok');
      return;
    }
    const { accessToken, refreshToken, expires } = token;
    asanaClient = Asana.Client.create().useAccessToken(accessToken);
    // Case: when target user exist as known by RingCentral App
    if (user) {
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      user.tokenExpiredAt = expires;
      if (!user.rcUserId) {
        user.rcUserId = body.user.id;
      }
      await user.save();
    }
    // Case: when target user doesn't exist as known by RingCentral App
    else {
      // Step.1: Get user info with 3rd party API call
      const userInfo = await asanaClient.users.me(); // [REPLACE] userInfoResponse with actual user info API call to 3rd party server
      user = await User.findByPk(userInfo.gid);  // [REPLACE] this with actual user id
      // Case: when target user exists only as known by 3rd party platform
      if (user) {
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        user.tokenExpiredAt = expires;
        user.rcUserId = body.user.id;
        await user.save();
      }
      // Case: when target user doesn't exist as known by 3rd party platform
      else {
        // Step.2: Create a new user in DB if user doesn't exist
        await User.create({
          id: userInfo.gid,    // [REPLACE] id with actual id in user info
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenExpiredAt: expires,
          rcUserId: body.user.id,
        });
      }
    }
    await sendTextMessage(subscription.rcWebhookUri, `Hi ${body.user.firstName} ${body.user.lastName}, you have connected successfully. Please click action button again.`);
    res.status(200);
    res.send('ok');
    return;
  }
  // if the action is not 'authorize', then it needs to make sure that authorization is valid for this user
  else {
    if (user) {
      await checkAndRefreshAccessToken(user);
      asanaClient = Asana.Client.create().useAccessToken(user.accessToken);
    }
    // If an unknown user wants to perform actions, we want to authenticate and authorize first
    if (!user || !user.accessToken) {
      await sendAdaptiveCardMessage(subscription.rcWebhookUri, getAuthCard({
        authorizeUrl: oauth.code.getUri(),
        subscriptionId,
      }));
      res.status(200);
      res.send('OK');
      return;
    }
  }

  // Below tis the section for your customized actions handling
  if (action === 'completeTask') {
    // Step.3: Call 3rd party API to perform action that you want to apply
    try {
      // [INSERT] API call to perform action on 3rd party platform 
      const taskChange ={
        completed: true
      }
      await asanaClient.tasks.update(body.data.taskId,taskChange);
      // notify user the result of the action in RingCentral App conversation
      await sendTextMessage(subscription.rcWebhookUri, `Action completed`);
    } catch (e) {
      // Case: require auth
      if (e.statusCode === 401) {
        await sendAdaptiveCardMessage(subscription.rcWebhookUri, getAuthCard({
          authorizeUrl: oauth.code.getUri(),
          subscriptionId,
        }));
      }
      console.error(e);
    }
  }
  res.status(200);
  res.json('OK');
}

async function sendTextMessage(rcWebhook, message) {
  await axios.post(rcWebhook, {
    title: message,
    activity: 'Add-In Framework',
  }, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
}

async function sendAdaptiveCardMessage(rcWebhook, card) {
  const response = await axios.post(rcWebhook, {
    attachments: [
      card
    ]
  }, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  return response;
}

exports.notification = notification;
exports.interactiveMessages = interactiveMessages;