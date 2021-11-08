const { User } = require('../models/userModel');
const { Subscription } = require('../models/subscriptionModel');
const { Gitlab } = require('@gitbeaker/node');


async function onAuthorize(accessToken, refreshToken, expires) {// Step.1: Get user info from 3rd party API call
    const gitlabClient = new Gitlab({
        host: process.env.API_SERVER,
        oauthToken: accessToken,
    });
    const userInfoResponse = await gitlabClient.Users.current();   // [REPLACE] this line with actual call
    const userId = userInfoResponse.id; // [REPLACE] this line with user id from actual response

    // Find if it's existing user in our database
    let user = await User.findByPk(userId);
    // Step.2: If user doesn't exist, we want to create a new one
    if (!user) {
        user = await User.create({
            id: userId,
            accessToken: accessToken,
            refreshToken: refreshToken,
            tokenExpiredAt: expires,
            name: userInfoResponse.username, // [REPLACE] this with actual user name in response, [DELETE] this line if user info doesn't contain name
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
            const gitlabClient = new Gitlab({
                host: process.env.API_SERVER,
                oauthToken: accessToken,
            });

            const projectOption = {
                owned: true
            }
            const targetProject = await gitlabClient.Projects.search(process.env.TEST_PROJECT_NAME, projectOption);
            await gitlabClient.ProjectHooks.remove(targetProject[0].id, thirdPartySubscriptionId);
            await subscription.destroy();

        }
        await user.save();
    }
}

exports.onAuthorize = onAuthorize;
exports.onUnauthorize = onUnauthorize;