<%if (useOAuth) {%>const { decodeJwt } = require('../lib/jwt');
const { generate } = require('shortid');
const constants = require('../lib/constants');
const { User } = require('../models/userModel');<%}%>
const { Subscription } = require('../models/subscriptionModel');
<%if (useRefreshToken) {%>const { checkAndRefreshAccessToken } = require('../lib/oauth');<%}%>

<%if (useOAuth) {%>
async function subscribe(req, res) {
    // validate jwt
    const jwtToken = req.body.token;
    if (!jwtToken) {
        res.status(403);
        res.send('Params invalid.');
        return;
    }
    const decodedToken = decodeJwt(jwtToken);
    if (!decodedToken) {
        res.status(401);
        res.send('Token invalid');
        return;
    }

    // check for rcWebhookUri
    const rcWebhookUri = req.body.rcWebhookUri;
    if (!rcWebhookUri) {
        res.status(400);
        res.send('Missing rcWebhookUri');
        return;
    }

    // get existing user
    const userId = decodedToken.id;
    const user = await User.findByPk(userId);
    if (!user) {
        res.status(401);
        res.send('Unknown user');
        return;
    }

    // create webhook notification subscription
    try {
    <%if (useRefreshToken) {%>// check token refresh condition
        await checkAndRefreshAccessToken(user);<%}%>
        // Step.1: Generate an unique id
        // Note: notificationCallbackUrl here would contain our subscriptionId so that incoming notifications can be identified
        const subscriptionId = generate();
        const notificationCallbackUrl = `${process.env.APP_SERVER}${constants.route.forThirdParty.NOTIFICATION}?subscriptionId=${subscriptionId}`;
        
        // Step.2: Create a new webhook subscription on 3rd party platform. For most cases, you would want to define what resources/events you want to subscribe to as well.
        
        // Step.3: Get response from webhook creation.
        const webhookCreationResponse = {thirdPartySubscriptionId : "testSubId"};   // [REPLACE] this with actual API call to 3rd party platform to create a webhook subscription

        // Step.4: Create new subscription in DB
        await Subscription.create({
            id: subscriptionId,
            userId: userId, 
            rcWebhookUri: req.body.rcWebhookUri,
            thirdPartyWebhookId: webhookCreationResponse.thirdPartySubscriptionId   // [REPLACE] this with webhook subscription id from 3rd party platform response
        });
    
        res.status(200);
        res.json({
            result: 'ok'
        });
    }
    catch (e) {
        console.error(e);
        if (e.response && e.response.status === 401) {
            res.status(401);
            res.send('Unauthorized');
            return;
        }
        console.error(e);
        res.status(500);
        res.send('Internal server error');
        return;
    }
}
<%} else {%>
async function subscribe(req, res) {
    // check for rcWebhookUri
    const rcWebhookUri = req.body.rcWebhookUri;
    if (!rcWebhookUri) {
        res.status(400);
        res.send('Missing rcWebhookUri');
        return;
    }

    // create webhook notification subscription
    try {
        // Get subscriptionId
        const subscriptionId = req.body.subscriptionId;

        // Create new subscription in DB
        await Subscription.create({
            id: subscriptionId,
            rcWebhookUri: req.body.rcWebhookUri,
        });

        res.status(200);
        res.json({
            result: 'ok'
        });
    }
    catch (e) {
        console.error(e);
        if (e.response && e.response.status === 401) {
            res.status(401);
            res.send('Unauthorized');
            return;
        }
        console.error(e);
        res.status(500);
        res.send('Internal server error');
        return;
    }
}
<%}%>

exports.subscribe = subscribe;