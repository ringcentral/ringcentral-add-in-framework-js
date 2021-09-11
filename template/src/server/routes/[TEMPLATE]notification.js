const axios = require('axios');
const { Subscription } = require('../model/subscriptionModel');
const { User } = require('../model/userModel');
const { getOAuthApp<%if (useRefreshToken) {%>, checkAndRefreshAccessToken <%}%>} = require('../lib/oauth');
const constants = require('../lib/constants');
const crypto = require('crypto');
const { getAuthCard, getSampleStatusCard } = require('../lib/adaptiveCard');


// Note: for practicality, incoming notification should be validated with 'x-hook-secret' header during  webhook creation handshake (https://developers.asana.com/docs/webhooks)
async function notification(req, res) {
    try {
        console.log(`Receiving notification: ${JSON.stringify(req.body, null, 2)}`);
        // Step.1: Identify which user or subscription is relevant, normally by 3rd party webhook id or user id. 
        // Note: How we get subscriptionId from notification would depend on which flow we choose in `subscription.js` when we create our webhook subscription
        const subscriptionId = "subscriptionId" // [REPLACE] this with actual subscriptionId from req
        const subscription = await Subscription.findByPk(subscriptionId);
        <%if (useRefreshToken) {%>// check token refresh condition
        const user = await User.findByPk(userId);
            await checkAndRefreshAccessToken(user);<%}%>
        // Step.2: Extract info from 3rd party notification POST body
        const testNotificationInfo = {
            title: "This is a test title",
            message: "This is a test message",
            linkToPage: "about:blank"
        }

        // Step.3(optional): Filter out notifications that user is not interested in, because some platform may not have a build-in filtering mechanism.

        // Step.4: Transform notification info into RingCentral App adaptive card - design your own adaptive card: https://adaptivecards.io/designer/
        const card = getSampleStatusCard({
            title: testNotificationInfo.title,
            content: testNotificationInfo.message,
            link: testNotificationInfo.linkToPage,
            subscriptionId: subscriptionId
        });

        // Step.5: Send adaptive card to your channel in RingCentral App
        console.log(`[DEBUG]Adaptive card:\n ${JSON.stringify(card, null, 2)}`);
        await sendAdaptiveCardMessage(subscription.rcWebhookUri, card);
    } catch (e) {
        console.error(e);
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
    const action = body.data.action;
    if (action === 'authorize') {
      const buff = Buffer.from(body.data.token, 'base64');
      const authQuery = buff.toString('ascii');
      let token;
      try {
        // callbackUri here is from 3rd party, identical to the one in authorization.js - generateToken()
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
      // Case: when target user exists
      if (user) {
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        user.tokenExpiredAt = expires;
        if(!user.rcUserId)
        {
          user.rcUserId = body.user.id;
        }
        await user.save();
      }
      // Case: when target user doesn't exist
      else {
        // Step.1: Get user info with 3rd party API call
        const userInfoResponse = {} // [REPLACE] userInfoResponse with actual user info API call to 3rd party server
        user = await User.findByPk(userInfoResponse.id);
        if (user) {
          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          user.tokenExpiredAt = expires;
          user.rcUserId = body.user.id;
          await user.save();
        } else {
          await User.create({
            id: userInfoResponse.id,    // [REPLACE] id with actual id in user info
            name: userInfoResponse.name,    // [REPLACE] name with actual name in user info, this field is optional
            accessToken,
            refreshToken,
            tokenExpiredAt: expires,
            rcUserId: body.user.id,
          });
        }
      }
      await sendTextMessage(subscription.rcWebhookUri, `Hi ${body.user.firstName} ${body.user.lastName}, you have connected Asana successfully. Please click action button again.`);
      res.status(200);
      res.send('ok');
      return;
    }
    else {
        <%if (useRefreshToken) {%>if (user) {
        await checkAndRefreshAccessToken(user);
      }<%}%>
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
    // testActionType is from adaptiveCard.js - getSampleCard()
    if (action === 'testActionType') {
        // Step.2: Call 3rd party API to perform action that you want to apply
        try {
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
        activity: 'Asana',
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