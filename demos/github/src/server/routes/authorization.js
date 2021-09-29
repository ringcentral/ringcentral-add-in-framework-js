const { User } = require('../models/userModel');
const { Subscription } = require('../models/subscriptionModel');
const { decodeJwt, generateJwt } = require('../lib/jwt');
const { getOAuthApp } = require('../lib/oauth');
const { Octokit } = require('@octokit/rest');

async function openAuthPage(req, res) {
    try {
        const oauthApp = getOAuthApp();
        const url = oauthApp.code.getUri();
        console.log(`Opening auth page: ${url}`);
        res.redirect(url);
    } catch (e) {
        console.error(e);
    }
}

async function getUserInfo(req, res) {
    const jwtToken = req.query.token;
    if (!jwtToken) {
        res.status(403);
        res.send('Error params');
        return;
    }
    const decodedToken = decodeJwt(jwtToken);
    if (!decodedToken) {
        res.status(401);
        res.send('Token invalid.');
        return;
    }
    const userId = decodedToken.id;
    const user = await User.findByPk(userId);
    if (!user || !user.accessToken) {
        res.status(401);
        res.send('Token invalid.');
        return;
    }

    const subscription = await Subscription.findOne({
        where: {
            rcWebhookUri: rcWebhookUri
        }
    });
    const hasSubscription = subscription != null;

    res.json({ user, hasSubscription });
}


async function generateToken(req, res) {
    const oauthApp = getOAuthApp();
    const { accessToken } = await oauthApp.code.getToken(req.body.callbackUri);
    if (!accessToken) {
        res.status(403);
        res.send('Params error');
        return;
    }
    console.log(`Receiving accessToken: ${accessToken}`);
    try {
        // Step1: Get user info from 3rd party API call
        // create authorized Github client object with accessToken
        const octokit = new Octokit({
            auth: accessToken
        });
        const { data: userInfo } = await octokit.users.getAuthenticated(); // [REPLACE] this line with actual call
        const userId = userInfo.id; // [REPLACE] this line with user id from actual response
        const userName = userInfo.login;

        // Find if it's existing user in our database
        const user = await User.findByPk(userId);
        // Step2: If user doesn't exist, we want to create a new one
        if (!user) {
            await User.create({
                id: userId,
                accessToken: accessToken,
                name: userName, // [REPLACE] this with actual user name in response, [DELETE] this line if user info doesn't contain name
            });
        }
        else {
            user.accessToken = accessToken;
            await user.save();
        }
        // Return jwt to client for future client-server communication
        const jwtToken = generateJwt({ id: userId });
        res.status(200);
        res.json({
            authorize: true,
            token: jwtToken,
        });
    } catch (e) {
        console.error(e);
        res.status(500);
        res.send('Internal error.');
    }
}

async function revokeToken(req, res) {
    const jwtToken = req.body.token;
    if (!jwtToken) {
        res.status(403);
        res.send('Error params');
        return;
    }
    const decodedToken = decodeJwt(jwtToken);
    if (!decodedToken) {
        res.status(401);
        res.send('Token invalid.');
        return;
    }
    const userId = decodedToken.id;
    try {
        const user = await User.findByPk(userId);
        if (user) {
            const accessToken = user.accessToken;
            // Clear database info
            user.accessToken = '';
            user.rcUserId = '';
            // Step.1: Unsubscribe all webhook and clear subscriptions in db
            const subscription = await Subscription.findOne({
                where: {
                    rcWebhookUri: req.body.rcWebhookUri
                }
            });
            if (subscription && subscription.thirdPartyWebhookId) {
                const thirdPartySubscriptionId = subscription.thirdPartyWebhookId;
                // [INSERT] call to delete webhook subscription from 3rd party platform

                // create a github rest client
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
        res.status(200);
        res.json({
            result: 'ok',
            authorized: false,
        });
    } catch (e) {
        console.error(e);
        res.status(500);
        res.send('internal error');
    }
}

function oauthCallback(req, res) {
    res.render('oauth-callback');
};

exports.openAuthPage = openAuthPage;
exports.getUserInfo = getUserInfo;
exports.generateToken = generateToken;
exports.revokeToken = revokeToken;
exports.oauthCallback = oauthCallback;