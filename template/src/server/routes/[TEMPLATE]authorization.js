const { User } = require('../models/userModel');
const { Subscription } = require('../models/subscriptionModel');
const { decodeJwt, generateJwt } = require('../lib/jwt');
const { <%if (useRefreshToken) {%> checkAndRefreshAccessToken,<%}%> getOAuthApp } = require('../lib/oauth');

//====INSTRUCTION====
// go to generateToken() method below
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
    const rcWebhookUri = req.query.rcWebhookUri;
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
    <%if (useRefreshToken) {%>// check token refresh condition
        await checkAndRefreshAccessToken(user);<%}%>
        
    const subscription = await Subscription.findOne({
        where: {
            rcWebhookUri: rcWebhookUri
        }
    });
    const hasSubscription = subscription != null;
    res.json({ user, hasSubscription });
}

<%if (useRefreshToken) {%>
//====INSTRUCTION====
//search for [REPLACE] tags under Step.1. Note: It's recommended to use 3rd party platform's npm package to make API calls easier
async function generateToken(req, res) {
    const oauthApp = getOAuthApp();
    const { accessToken, refreshToken, expires } = await oauthApp.code.getToken(req.body.callbackUri);
    if (!accessToken || !refreshToken) {
        res.status(403);
        res.send('Params error');
        return;
    }
    console.log(`Receiving accessToken: ${accessToken} and refreshToken: ${refreshToken}`);
    try {
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
                accessToken: accessToken,
                refreshToken: refreshToken,
                tokenExpiredAt: expires,
                email: userInfoResponse.email, // [REPLACE] this with actual user email in response, [DELETE] this line if user info doesn't contain email
                name: userInfoResponse.name, // [REPLACE] this with actual user name in response, [DELETE] this line if user info doesn't contain name
            });
        }
        // If user exists but logged out, we want to fill in token info
        else if(!user.accessToken){
            user.accessToken = accessToken;
            user.refreshToken = refreshToken;
            user.tokenExpiredAt = expires;
            await user.save();
        }

        // [DELETE] this block after it correctly prints out userId from 3rd party platform, and go to subscription.js
        console.log('\n====================');
        console.log(`authorization.js - generateToken - Step.2\n[log]user: ${JSON.stringify(user, null, 2)}`);
        console.log('====================\n');
        // [DELETE] block end

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
<%} else {%>
//====INSTRUCTION====
//search for [REPLACE] tags under Step.1. Note: you'll probably want to use 3rd party platform's npm package to make things easier
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
                accessToken: accessToken,
                email: userInfoResponse.email, // [REPLACE] this with actual user email in response, [DELETE] this line if user info doesn't contain email
                name: userInfoResponse.name, // [REPLACE] this with actual user name in response, [DELETE] this line if user info doesn't contain name
            });
        }
        else{
            user.accessToken = accessToken;
            await user.save();
        }

        // [DELETE] this block after it correctly prints out userId from 3rd party platform, and go to subscription.js
        console.log('\n====================');
        console.log(`authorization.js - generateToken - Step.2\n[log]user: ${JSON.stringify(user, null, 2)}`);
        console.log('====================\n');
        // [DELETE] block end

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
<%}%>
// This methods is to log user out and unsubscribe everything under this user. Search for [INSERT] tag and make changes
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
            // Clear database info
            user.rcUserId = '';
            user.accessToken = '';<%if (useRefreshToken) {%>
            user.refreshToken = '';<%}%>
            // Step.1: Unsubscribe all webhook and clear subscriptions in db
            const subscriptions = await Subscription.findAll({
                where: {
                    userId: userId
                }
            });
            for (const subscription of subscriptions) {
                const sub = await Subscription.findByPk(subscription.id);
                const thirdPartySubscriptionId = sub.thirdPartyWebhookId;
                // [INSERT] call to delete webhook subscription from 3rd party platform

                await sub.destroy();
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