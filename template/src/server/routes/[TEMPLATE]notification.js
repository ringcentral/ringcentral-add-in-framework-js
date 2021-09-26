const axios = require('axios');
const { Subscription } = require('../models/subscriptionModel');
const { User } = require('../models/userModel');
<%if (useOAuth) {%>const { getOAuthApp<%if (useRefreshToken) {%>, checkAndRefreshAccessToken <%}%>} = require('../lib/oauth'); 
const constants = require('../lib/constants');<%}%>
const crypto = require('crypto');
const { Template } = require('adaptivecards-templating');

const authCardTemplate = require('../adaptiveCardPayloads/auth.json');
const authCardTemplateString = JSON.stringify(authCardTemplate, null, 2);
const sampleCardTemplate = require('../adaptiveCardPayloads/sample.json');
const sampleCardTemplateString = JSON.stringify(sampleCardTemplate, null, 2);
//====INSTRUCTION====
// Below methods is to receive 3rd party notification and format it into Adaptive Card and send to RingCentral App conversation
// It would already send sample message if any notification comes in. And you would want to extract info from the actual 3rd party call and format it.
// Adaptive Card Designer: https://adaptivecards.io/designer/
async function notification(req, res) {
    try {
        console.log(`Receiving notification: ${JSON.stringify(req.body, null, 2)}`);
        // Identify which user or subscription is relevant, normally by 3rd party webhook id or user id. 
        const subscriptionId = req.query.subscriptionId;
        const subscription = await Subscription.findByPk(subscriptionId);
        if(!subscription)
        {
          res.status(403);
          res.send('Unknown subscription id');
          return;
        }
        <%if (useRefreshToken) {%>// check token refresh condition
        const userId = subscription.userId;
        const user = await User.findByPk(userId);
        await checkAndRefreshAccessToken(user);<%}%>
        // Step.1: Extract info from 3rd party notification POST body
        const testNotificationInfo = {    // [REPLACE] this with codes to extract relevant info from 3rd party notification request body and/or headers
            title: "This is a test title",
            message: "This is a test message",
            linkToPage: "about:blank"
        } 
        // Step.2(optional): Filter out notifications that user is not interested in, some platform may not have a build-in filtering mechanism.  

        // Step.3: Transform notification info into RingCentral App adaptive card - design your own adaptive card: https://adaptivecards.io/designer/
        // If this step is successful, go to authorization.js - revokeToken() for the last step
        const cardPayload = {    // [REPLACE] this with your params that's customized to show info from 3rd party notification and provide interaction
            title: testNotificationInfo.title,
            content: testNotificationInfo.message,
            link: testNotificationInfo.linkToPage,
            subscriptionId: subscriptionId
        }; 
        // Send adaptive card to your channel in RingCentral App
        await sendAdaptiveCardMessage(
          subscription.rcWebhookUri, 
          sampleCardTemplateString,
          cardPayload);
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
          user.rcUserId = body.user.id;
        }
        await user.save();
      }
      // Case: when target user doesn't exist as known by RingCentral App
      else {
        // Step.1: Get user info with 3rd party API call
        const userInfoResponse = {} // [REPLACE] userInfoResponse with actual user info API call to 3rd party server
        user = await User.findByPk(userInfoResponse.id);  // [REPLACE] this with actual user id
        // Case: when target user exists only as known by 3rd party platform
        if (user) {
          user.accessToken = accessToken;
          <%if (useRefreshToken) {%>user.refreshToken = refreshToken;
          user.tokenExpiredAt = expires;<%}%>
          user.rcUserId = body.user.id;
          await user.save();
        } 
        // Case: when target user doesn't exist as known by 3rd party platform
        else {
          // Step.2: Create a new user in DB if user doesn't exist
          await User.create({
            id: userInfoResponse.id,    // [REPLACE] id with actual id in user info
            name: userInfoResponse.name,    // [REPLACE] name with actual name in user info, this field is optional
            accessToken: accessToken,
            <%if (useRefreshToken) {%>refreshToken: refreshToken,
            tokenExpiredAt: expires,<%}%>
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
        <%if (useRefreshToken) {%>if (user) {
        await checkAndRefreshAccessToken(user);
      }<%}%>
      // If an unknown user wants to perform actions, we want to authenticate and authorize first
      if (!user || !user.accessToken) {
        await sendAdaptiveCardMessage(
          subscription.rcWebhookUri, 
          authCardTemplateString,
          {
            authorizeUrl: oauth.code.getUri(),
            subscriptionId,
          });
        res.status(200);
        res.send('OK');
        return;
      }
    }

    // Below tis the section for your customized actions handling
    // testActionType is from adaptiveCard.js - getSampleCard()
    if (action === 'testActionType') {
        // Step.3: Call 3rd party API to perform action that you want to apply
        try {
            // [INSERT] API call to perform action on 3rd party platform 
            // notify user the result of the action in RingCentral App conversation
            await sendTextMessage(subscription.rcWebhookUri, `Action completed`);
        } catch (e) {
            // Case: require auth
            if (e.statusCode === 401) {
                await sendAdaptiveCardMessage(
                  subscription.rcWebhookUri, 
                  authCardTemplateString,
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
    // Step.1: Call 3rd party platform to validate accessToken
    const accessToken = body.data.token;
    try {
      const validationResponse = {} // [REPLACE] this with actual API call with accessToken to validate
    } catch (e) {
      console.error('Get token error');
      await sendTextMessage(subscription.rcWebhookUri, `Hi ${body.user.firstName} ${body.user.lastName}, the token is invalid.`)
      res.status(200);
      res.send('ok');
      return;
    }
    // Case: when target user exists as known by RingCentral App
    if (user) {
      user.accessToken = accessToken;
      await user.save();
    }
    // Case: when target user doesn't exist as known by RingCentral App
    else {
      // Step.2: Get user info with 3rd party API call
      const userInfoResponse = {} // [REPLACE] userInfoResponse with actual user info API call to 3rd party server
      user = await User.findByPk(userInfoResponse.id);  // [REPLACE] this with actual user id
      // Case: when target user exists only as known by 3rd party platform
      if (user) {
        user.accessToken = accessToken;
        user.rcUserId = body.user.id;
        await user.save();
      } 
      // Case: when target user doesn't exist as known by 3rd party platform
      else {
        // Step.3: Create a new user in DB if user doesn't exist
        await User.create({
          id: userInfoResponse.id,    // [REPLACE] id with actual id in user info
          name: userInfoResponse.name,    // [REPLACE] name with actual name in user info, this field is optional
          accessToken: accessToken,
          rcUserId: body.user.id,
        });
      }
    }
    await sendTextMessage(subscription.rcWebhookUri, `Hi ${body.user.firstName} ${body.user.lastName}, you have connected Asana successfully. Please click action button again.`);
    res.status(200);
    res.send('ok');
    return;
  }
  // if the action is not 'authorize', then it needs to make sure that authorization is valid for this user
  else {
    if (!user || !user.accessToken) {
      // Step.4: if an unknown user wants to perform actions, we want to authorize first
      await sendAdaptiveCardMessage(
        subscription.rcWebhookUri,
        authCardTemplateString,
        {
          authorizeUrl: '{url to get accessToken}', // [REPLACE] the string with actual url to where user can get/generate accessToken on 3rd party platform
          subscriptionId,
        });
      res.status(200);
      res.send('OK');
      return;
    }
  }

  // Below tis the section for your customized actions handling
  // testActionType is from adaptiveCard.js - getSampleCard()
  if (action === 'testActionType') {
    // Step.5: Call 3rd party API to perform action that you want to apply
    try {
      // [INSERT] API call to perform action on 3rd party platform 
      // notify user the result of the action in RingCentral App conversation
      await sendTextMessage(subscription.rcWebhookUri, `Action completed`);
    } catch (e) {
      // Case: require auth
      if (e.statusCode === 401) {
        await sendAdaptiveCardMessage(
          subscription.rcWebhookUri,
          authCardTemplateString,
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

async function sendAdaptiveCardMessage(rcWebhook, cardTemplate, cardPayload) {
  const template = new Template(cardTemplate);
  const card = template.expand({
    $root: cardPayload
  });
  console.log(card);
  const response = await axios.post(rcWebhook, {
    attachments: [
      JSON.parse(card),
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