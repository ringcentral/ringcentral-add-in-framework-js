const { User } = require('../models/userModel');
const { Subscription } = require('../models/subscriptionModel');

<%if (useRefreshToken) {%>
async function onAuthorize(accessToken, refreshToken, expires) {<%} else {%>
async function onAuthorize(accessToken) {<%}%>
    // Step.1: Get user info from 3rd party API call
    const userInfoResponse = { id: "id", email: "email", name: "name" }   // [REPLACE] this line with actual call
    const userId = userInfoResponse.id; // [REPLACE] this line with user id from actual response

    // [DELETE] this block after it correctly prints out userId from 3rd party platform, and go to Step2
    console.log('\n====================');
    console.log(`authorization.js - generateToken - Step.1\n[log]userId: ${userId}`);
    console.log('====================');
    return;
    // [DELETE] block end

    // Find if it's existing user in our database
    let user = await User.findByPk(userId);
    // Step.2: If user doesn't exist, we want to create a new one
    if (!user) {
        user = await User.create({
            id: userId,
            accessToken: accessToken,<%if (useRefreshToken) {%>
            refreshToken: refreshToken,
            tokenExpiredAt: expires,<%}%>
            email: userInfoResponse.email, // [REPLACE] this with actual user email in response, [DELETE] this line if user info doesn't contain email
            name: userInfoResponse.name, // [REPLACE] this with actual user name in response, [DELETE] this line if user info doesn't contain name
        });
    }
    // If user exists but logged out, we want to fill in token info
    else if (!user.accessToken) {
        user.accessToken = accessToken;<%if (useRefreshToken) {%>
        user.refreshToken = refreshToken;
        user.tokenExpiredAt = expires;<%}%>
        await user.save();
    }

    // [DELETE] this block after it correctly prints out userId from 3rd party platform
    console.log('\n====================');
    console.log(`authorization.js - generateToken - Step.2\n[log]user: ${JSON.stringify(user, null, 2)}`);
    console.log('====================\n');
    // [DELETE] block end

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

            await subscription.destroy();

        }
        await user.save();
    }
}

exports.onAuthorize = onAuthorize;
exports.onUnauthorize = onUnauthorize;