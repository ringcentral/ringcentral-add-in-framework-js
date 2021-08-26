const { User } = require('../db/userModel');
const { Subscription } = require('../db/subscriptionModel');
const { decodeToken, generateToken } = require('../lib/jwt');
const { Octokit } = require('@octokit/rest');
const constants = require('../lib/constants');
const ClientOAuth2 = require('client-oauth2');

// oauthApp strategy is default to 'code' which use credentials to get accessCode
// then exchange accessCode for accessToken and refreshToken.
// To change to other strategies, please refer to: https://github.com/mulesoft-labs/js-client-oauth2
const { code: oauthApp } = new ClientOAuth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    accessTokenUri: process.env.ACCESS_TOKEN_URI,
    authorizationUri: process.env.AUTHORIZATION_URI,
    redirectUri: `${process.env.APP_SERVER}${constants.route.forThirdParty.AUTH_CALLBACK}`,
    scopes: process.env.SCOPES.split(process.env.SCOPES_SEPARATOR)
});

async function openAuthPage(req, res) {
    try {
        // [Actual Flow]: 1. open auth page -> 2. do auth -> 3. 3rd party service call back with user tokens
        // ===[MOCK]===
        // [Mocked Flow]: 1. mock 3rd party service call back with mock user tokens
        // mockAuthCallback: it is to mock the callback action that happens after a successful auth
        // replace "mockAuthCallback(res, `xxx`);" with "res.redirect(authUrl);" so that it starts from step1: open auth page
        const url = oauthApp.getUri();
        res.redirect(url);
        // ===[MOCK_END]===
    } catch (e) {
        console.error(e);
    }
}

async function getUserInfo(req, res) {
    if (req.query.token) {
        const jwtToken = req.query.token;
        if (!jwtToken) {
            res.send('Error params');
            res.status(403);
            return;
        }
        const decodedToken = decodeToken(jwtToken);
        if (!decodedToken) {
            res.send('Token invalid.');
            res.status(401);
            return;
        }
        const userId = decodedToken.id;
        const user = await User.findByPk(userId);
        res.json(user);
    }
}

async function saveUserInfo(req, res) {
    // ===[MOCK]===
    // replace this with logic to get real tokens from 3rd party callback
    // mockTokenResponse mocks the response from API call to exchange code for accessToken and refreshToken
    const code = req.body.code;
    console.log(`accessCode: ${code}`);
    if (!code) {
        // ===[MOCK_END]===
        res.send('Params error');
        res.status(403);
        return;
    }
    try {
        // ===[MOCK]===
        // replace this with actual call to 3rd party service with access token, and retrieve user info
        // exchange code for accessToken
        const { accessToken } = await oauthApp.getToken(code);
        console.log(`accessToken: ${accessToken}`);
        // create authorized Github client object with accessToken
        const octokit = new Octokit({
            auth: accessToken
        });
        // get Github userInfo
        const { data: userInfo } = await octokit.users.getAuthenticated();
        const userId = userInfo.id;
        const userName = userInfo.login;
        console.log(`userName: ${userName}`);
        let user = await User.findByPk(userId);
        // if existing user - we want to update token
        if (user) {
            user.tokens.accessToken = accessToken;
            await user.save();
        }
        // if new user - we want to create it with token. Token will be used for future API calls
        else {
            await User.create({
                id: userId,
                name: userName,
                tokens: {
                    accessToken: accessToken
                },
                rcWebhookUri: req.body.rcWebhookUri
            });
        }

        // ===[MOCK_END]===
        // return jwt to client for future client-server communication
        const jwtToken = generateToken({ id: userId });
        console.log(`jwtToken sent to client: ${jwtToken}`);
        res.json({
            authorize: true,
            token: jwtToken,
        });
        res.status(200);
    } catch (e) {
        console.error(e);
        res.send('Internal error.');
        res.status(500);
    }
}

async function revokeToken(req, res) {
    const jwtToken = req.body.token;
    if (!jwtToken) {
        res.send('Error params');
        res.status(403);
        return;
    }
    const decodedToken = decodeToken(jwtToken);
    if (!decodedToken) {
        res.send('Token invalid.');
        res.status(401);
        return;
    }
    const userId = decodedToken.id;
    try {
        const user = await User.findByPk(userId);
        if (user && user.subscriptionId) {
            // ===[MOCK]===
            // unsubscribe - This can be separated to subscription.js as a different method
            const octokit = new Octokit({
                auth: user.tokens.accessToken
            });
            const webhookResponse = octokit.repos.deleteWebhook({
                owner: user.name,
                repo: process.env.TEST_REPO_NAME,
                hook_id: user.subscriptionId
            });
            // ===[MOCK_END]===
            if (webhookResponse != null) {
                // clear user db data
                await user.destroy();
                // clear subscription db data
                const subscription = await Subscription.findByPk(user.subscriptionId);
                if (subscription) {
                    await subscription.destroy();
                }
            }
        }

        res.json({
            result: 'ok',
            authorized: false,
        });
        res.status(200);
    } catch (e) {
        console.error(e);
        res.send('internal error');
        res.status(500);
    }
}

function oauthCallback(req, res) {
    res.render('oauth-callback');
};

exports.openAuthPage = openAuthPage;
exports.getUserInfo = getUserInfo;
exports.saveUserInfo = saveUserInfo;
exports.revokeToken = revokeToken;
exports.oauthCallback = oauthCallback;