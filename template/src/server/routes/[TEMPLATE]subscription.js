<%if (useOAuth) {%>const { decodeJwt } = require('../lib/jwt');
const { User } = require('../models/userModel');<%}%>
<%if (useRefreshToken) {%>const { checkAndRefreshAccessToken } = require('../lib/oauth');<%}%>
const { onSubscribe } = require('../handlers/subscriptionHandler');
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
    const user = await User.findByPk(userId.toString());
    if (!user) {
        res.status(401);
        res.send('Unknown user');
        return;
    }

    // create webhook notification subscription
    try {
    <%if (useRefreshToken) {%>// check token refresh condition
        await checkAndRefreshAccessToken(user);<%}%>
        await onSubscribe(user, rcWebhookUri);    
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