const { decodeJwt } = require('../lib/jwt');
const { generate } = require('shortid');
const constants = require('../lib/constants');
const { User } = require('../models/userModel');
const { Subscription } = require('../models/subscriptionModel');
const { checkAndRefreshAccessToken } = require('../lib/oauth');
const Asana = require('asana');


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
        const client = Asana.Client.create().useAccessToken(user.accessToken);
        // get target resource id for my user task list
        const workspaces = await client.workspaces.findAll();
        const targetWorkspace = workspaces.data[0];
        const taskList = await client.userTaskLists.findByUser("me", { workspace: targetWorkspace.gid });

        // Step.2: Get data from webhook creation response.
        // Here is a workaround to create a DB record before webhook is created on Asana, because Asana need send a handshake message before creating the webhook
        const subscription = await Subscription.create({
            id: subscriptionId,
            userId: userId,
            rcWebhookUri: req.body.rcWebhookUri
        });
        const webhookResponse = await client.webhooks.create(
            taskList.gid,
            notificationCallbackUrl,
            {
                filters: [
                    {
                        resource_type: 'task',
                        action: 'changed',
                        fields: [
                            'name'
                        ]
                    }
                ]
            });   // [REPLACE] this with actual API call to 3rd party platform to create a webhook subscription

        // Step.3: Create new subscription in DB
        subscription.thirdPartyWebhookId =  webhookResponse.gid   // [REPLACE] this with webhook subscription id from 3rd party platform response
        await subscription.save();

        res.status(200);
        res.json({
            result: 'ok'
        });
    }
    catch (e) {
        console.error(JSON.stringify(e, null, 2));
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