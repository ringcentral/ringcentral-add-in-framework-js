const { User } = require('../models/userModel');
const { Subscription } = require('../models/subscriptionModel');
const Asana = require('asana');


async function onAuthorize(accessToken, refreshToken, expires) {

    // Step1: Get user info from 3rd party API call
    const client = Asana.Client.create().useAccessToken(accessToken);
    const userInfo = await client.users.me();   // [REPLACE] this line with actual call
    const userId = userInfo.gid; // [REPLACE] this line with user id from actual response
    // Find if it's existing user in our database
    const user = await User.findByPk(userId);
    // Step2: If user doesn't exist, we want to create a new one
    if (!user) {
        await User.create({
            id: userId,
            accessToken: accessToken,
            refreshToken: refreshToken,
            tokenExpiredAt: expires
        });
    }
    // If user exists but logged out, we want to fill in token info
    else if (!user.accessToken) {
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        user.tokenExpiredAt = expires;
        await user.save();
    }
    return userId;
}

async function onUnauthorize(userId) {
    const user = await User.findByPk(userId);
    if (user) {
        // Clear database info
        user.rcUserId = '';
        user.accessToken = '';
        // Step.1: Unsubscribe all webhook and clear subscriptions in db
        const subscription = await Subscription.findOne({
            where: {
                rcWebhookUri: req.body.rcWebhookUri
            }
        });
        if (subscription && subscription.thirdPartyWebhookId) {
            const thirdPartySubscriptionId = subscription.thirdPartyWebhookId;
            // [INSERT] call to delete webhook subscription from 3rd party platform
            const client = Asana.Client.create().useAccessToken(user.accessToken);
            await client.webhooks.deleteById(thirdPartySubscriptionId);
            await subscription.destroy();

        }
        await user.save();
    }
}

exports.onAuthorize = onAuthorize;
exports.onUnauthorize = onUnauthorize;