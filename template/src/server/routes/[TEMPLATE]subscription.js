const { decodeJwt } = require('../lib/jwt');
const { User } = require('../model/userModel');
const { Subscription } = require('../model/subscriptionModel');
const constants = require('../lib/constants');
<%if (useRefreshToken) {%>const { checkAndRefreshAccessToken } = require('../lib/oauth');<%}%>

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
    // CHOOSE one of flows below and DELETE the other. If 3rd party service includes subscriptionId in their subscription notification, go with Flow.1, otherwise go with Flow.2
    <%if (useRefreshToken) {%>// check token refresh condition
    await checkAndRefreshAccessToken(user);<%}%>
    // Flow.1: Use 3rd party service webhook id as our subscriptionId:
        const notificationCallbackUrl = `${process.env.APP_SERVER}${constants.route.forThirdParty.NOTIFICATION}`;

        // Step.1: Create a new webhook subscription on 3rd party platform. For most cases, you would want to define what resources/events you want to subscribe to as well.

        // Step.2: Get response from webhook creation.
        const webhookResponse = { id: "id" };   // [REPLACE] this with actual webhook subscription creation API call

        // Step.3: Create new subscription in DB
        await Subscription.create({
            id: webhookResponse.id,
            userId: userId,
            rcWebhookUri: req.body.rcWebhookUri,
        });

    // Flow.2: Create our own subscriptionId:

        // Step.1: Generate an unique id, our recommendation is using a npm package to do it. Eg. https://www.npmjs.com/package/uuid
        // Note: notificationCallbackUrl here would contain our subscriptionId so that incoming notifications can be identified
        const subscriptionId = "subscriptionId";
        const notificationCallbackUrl = `${process.env.APP_SERVER}${constants.route.forThirdParty.NOTIFICATION}?subscriptionId=${subscriptionId}`;
        
        // Step.1: Create a new webhook subscription on 3rd party platform. For most cases, you would want to define what resources/events you want to subscribe to as well.

        // Step.2: Get response from webhook creation.

        // Step.3: Create new subscription in DB
        await Subscription.create({
            id: subscriptionId,
            userId: userId,
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

exports.subscribe = subscribe;