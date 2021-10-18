const { decodeJwt } = require('../lib/jwt');
const { generate } = require('shortid');
const constants = require('../lib/constants');
const { User } = require('../models/userModel');
const { Subscription } = require('../models/subscriptionModel');
const { checkAndRefreshAccessToken } = require('../lib/oauth');
const { Gitlab } = require('@gitbeaker/node');


//====INSTRUCTION====
// search for [REPLACE] tags under Step.1-3. Note: It's recommended to use 3rd party platform's npm package to make API calls easier
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
        // check token refresh condition
        await checkAndRefreshAccessToken(user);
        // Generate an unique id
        // Note: notificationCallbackUrl here would contain our subscriptionId so that incoming notifications can be identified
        const subscriptionId = generate();
        const notificationCallbackUrl = `${process.env.APP_SERVER}${constants.route.forThirdParty.NOTIFICATION}?subscriptionId=${subscriptionId}`;

        // Step.1: [INSERT]Create a new webhook subscription on 3rd party platform with their API. For most cases, you would want to define what resources/events you want to subscribe to as well.
        const gitlabClient = new Gitlab({
            host: process.env.API_SERVER,
            oauthToken: user.accessToken,
        });

        const projectOption = {
            owned: true
        }
        const targetProject = await gitlabClient.Projects.search(process.env.TEST_PROJECT_NAME, projectOption);

        const webhookOption ={
            issues_events: true
        }
        const webhookResponse = await gitlabClient.ProjectHooks.add(targetProject[0].id, notificationCallbackUrl, webhookOption);

        // Step.2: Get data from webhook creation response.
        const webhookData = { thirdPartySubscriptionId: webhookResponse.id };   // [REPLACE] this with actual API call to 3rd party platform to create a webhook subscription

        // Step.3: Create new subscription in DB. Note: If up till now, it's running correctly, most likely your RingCentral App conversation will receive message in the form of Adaptive Card (exception: Asana - more info: try asana demo with 'npx ringcentral-add-in-framework demo')
        await Subscription.create({
            id: subscriptionId,
            userId: userId,
            rcWebhookUri: req.body.rcWebhookUri,
            thirdPartyWebhookId: webhookData.thirdPartySubscriptionId   // [REPLACE] this with webhook subscription id from 3rd party platform response
        });

        // Step.4: If your RingCentral App receives an Adaptive Card, go to notification.js for next step

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
        res.status(500);
        res.send('Internal server error');
        return;
    }
}


exports.subscribe = subscribe;