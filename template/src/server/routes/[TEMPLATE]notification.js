const axios = require('axios');
const { Subscription } = require('../models/subscriptionModel');
const { User } = require('../models/userModel');
<%if (useOAuth) {%>const { getOAuthApp<%if (useRefreshToken) {%>, checkAndRefreshAccessToken <%}%>} = require('../lib/oauth'); 
const constants = require('../lib/constants');<%}%>
const crypto = require('crypto');
const { onReceiveNotification, onReceiveInteractiveMessage } = require('../handlers/notificationHandler');
const { onAuthorize } = require('../handlers/authorizationHandler');
const { sendTextMessage, sendAdaptiveCardMessage } = require('../lib/messageHelper');

const authCardTemplate = require('../adaptiveCardPayloads/auth.json');
//====INSTRUCTION====
// Below methods is to receive 3rd party notification and format it into Adaptive Card and send to RingCentral App conversation
// It would already send sample message if any notification comes in. And you would want to extract info from the actual 3rd party call and format it.

//====ADAPTIVE CARD DESIGN====
// Adaptive Card Designer: https://adaptivecards.io/designer/
// Add new card: Copy the whole payload in CARD PAYLOAD EDITOR from card designer and create a new .json file for it under `src/server/adaptiveCardPayloads` folder. Also remember to reference it.
async function notification(req, res) {
    try {
        // Identify which user or subscription is relevant, normally by 3rd party webhook id or user id. 
        const subscriptionId = req.query.subscriptionId;
        const subscription = await Subscription.findByPk(subscriptionId);
        if(!subscription)
        {
          res.status(403);
          res.send('Unknown subscription id');
          return;
        }
        
        const userId = subscription.userId;
        const user = await User.findByPk(userId.toString());
        <%if (useRefreshToken) {%>// check token refresh condition
        await checkAndRefreshAccessToken(user);<%}%>
        await onReceiveNotification(req.body, subscription, user);
    } catch (e) {
        console.error(e);
    }

    res.status(200);
    res.json({
        result: 'OK',
    });
}

<%if (useOAuth) {%>
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
      const { accessToken<%if (useRefreshToken) {%>, refreshToken, expires<%}%>} = token;
      // Case: when target user exist as known by RingCentral App
      if (user) {
        user.accessToken = accessToken;
        <%if (useRefreshToken) {%>user.refreshToken = refreshToken;
        user.tokenExpiredAt = expires;<%}%>
        if(!user.rcUserId)
        {
          user.rcUserId = body.user.id.toString();
        }
        await user.save();
      }
      // Case: when target user doesn't exist as known by RingCentral App
      else {<%if (useRefreshToken) {%>
        const userId = await onAuthorize(accessToken, refreshToken, expires); <%} else {%>
        const userId = await onAuthorize(accessToken); <%}%>
        user = await User.findByPk(userId);
        user.rcUserId = body.user.id.toString();
        await user.save();
      }
      await sendTextMessage(subscription.rcWebhookUri, `Hi ${body.user.firstName} ${body.user.lastName}, you have connected successfully. Please click action button again.`);
      res.status(200);
      res.send('ok');
      return;
    }
    // if the action is not 'authorize', then it needs to make sure that authorization is valid for this user
    else {
        <%if (useRefreshToken) {%>if (user) {
        await checkAndRefreshAccessToken(user);
      }<%}%>
      // If an unknown user wants to perform actions, we want to authenticate and authorize first
      if (!user || !user.accessToken) {
        await sendAdaptiveCardMessage(
          subscription.rcWebhookUri, 
          authCardTemplate,
          {
            authorizeUrl: oauth.code.getUri(),
            subscriptionId,
          });
        res.status(200);
        res.send('OK');
        return;
      }
    }

    // Call 3rd party API to perform action that you want to apply
    try {
        await onReceiveInteractiveMessage(req.body.data, user);
        // notify user the result of the action in RingCentral App conversation
        await sendTextMessage(subscription.rcWebhookUri, `Action completed`);
    } catch (e) {
        // Case: require auth
        if (e.statusCode === 401) {
            await sendAdaptiveCardMessage(
              subscription.rcWebhookUri, 
              authCardTemplate,
              {
                authorizeUrl: oauth.code.getUri(),
                subscriptionId,
              });
        }
    console.error(e);
    }
    res.status(200);
    res.json('OK');
}
<%} else {%>
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
  let user = await User.findOne({ where: { rcUserId: body.user.id } });
  const action = body.data.action;
  if (action === 'authorize') {
    // Call 3rd party platform to validate accessToken
    const accessToken = body.data.token;
    // Case: when target user exists as known by RingCentral App
    if (user) {
      user.accessToken = accessToken;
      await user.save();
    }
    // Case: when target user doesn't exist as known by RingCentral App
    else {
      const userId = await onAuthorize(accessToken);
      user = await User.findByPk(userId);
      user.rcUserId = body.user.id.toString();
      await user.save();
    }
    await sendTextMessage(subscription.rcWebhookUri, `Hi ${body.user.firstName} ${body.user.lastName}, you have connected Asana successfully. Please click action button again.`);
    res.status(200);
    res.send('ok');
    return;
  }
  // if the action is not 'authorize', then it needs to make sure that authorization is valid for this user
  else {
    if (!user || !user.accessToken) {
      // if an unknown user wants to perform actions, we want to authorize first
      await sendAdaptiveCardMessage(
        subscription.rcWebhookUri,
        authCardTemplate,
        {
          authorizeUrl: '{url to get accessToken}', // [REPLACE] the string with actual url to where user can get/generate accessToken on 3rd party platform
          subscriptionId,
        });
      res.status(200);
      res.send('OK');
      return;
    }
  }

  // Call 3rd party API to perform action that you want to apply
  try {
    await onReceiveInteractiveMessage(req.body.data, user);
    // notify user the result of the action in RingCentral App conversation
    await sendTextMessage(subscription.rcWebhookUri, `Action completed`);
  } catch (e) {
    // Case: require auth
    if (e.statusCode === 401) {
      await sendAdaptiveCardMessage(
        subscription.rcWebhookUri,
        authCardTemplate,
        {
          authorizeUrl: oauth.code.getUri(),
          subscriptionId,
        });
      }
    console.error(e);
    }
  }
  res.status(200);
  res.json('OK');
}
<%}%>
exports.notification = notification;
exports.interactiveMessages = interactiveMessages;