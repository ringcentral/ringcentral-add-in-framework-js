const { User } = require('../models/userModel');
const { Subscription } = require('../models/subscriptionModel');
const { Octokit } = require('@octokit/rest');

async function onAuthorize(accessToken) {
    // Step.1: Get user info from 3rd party API call
    const octokit = new Octokit({
        auth: accessToken
    });
    const { data: userInfo } = await octokit.users.getAuthenticated(); // [REPLACE] this line with actual call
    const userId = userInfo.id; // [REPLACE] this line with user id from actual response
    const userName = userInfo.login;

    // Find if it's existing user in our database
    let user = await User.findByPk(userId);
    // Step.2: If user doesn't exist, we want to create a new one
    if (!user) {
        user = await User.create({
            id: userId,
            accessToken: accessToken,
            name: userName, // [REPLACE] this with actual user name in response, [DELETE] this line if user info doesn't contain name
        });
    }
    else {
        user.accessToken = accessToken;
        await user.save();
    }
    
    return userId;
}

async function onUnauthorize(userId){
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
            const octokit = new Octokit({
                auth: accessToken
            });

            await octokit.repos.deleteWebhook({
                owner: user.name,
                repo: process.env.GITHUB_REPO_NAME,
                hook_id: thirdPartySubscriptionId
            });
            await subscription.destroy();

        }
        await user.save();
    }
}

exports.onAuthorize = onAuthorize;
exports.onUnauthorize = onUnauthorize;