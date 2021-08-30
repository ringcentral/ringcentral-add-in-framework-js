const { User } = require('../db/userModel');
const { Subscription } = require('../db/subscriptionModel');
const { decodeToken, generateToken } = require('../lib/jwt');
const constants = require('../lib/constants');
const ClientOAuth2 = require('client-oauth2');
const { Token } = require('client-oauth2');

// oauthApp strategy is default to 'code' which use credentials to get accessCode, then exchange for accessToken and refreshToken.
// To change to other strategies, please refer to: https://github.com/mulesoft-labs/js-client-oauth2
const oauthApp = new ClientOAuth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    accessTokenUri: process.env.ACCESS_TOKEN_URI,
    authorizationUri: process.env.AUTHORIZATION_URI,
    redirectUri: `${process.env.APP_SERVER}${constants.route.forThirdParty.AUTH_CALLBACK}`,
    scopes: process.env.SCOPES.split(process.env.SCOPES_SEPARATOR)
});

async function openAuthPage(req, res) {
    try {
        // ===[MOCK]===
        // Hack Warning!!!: Below [Mocked Flow] shortcuts [Actual Flow], please refer to the comparison
        // [Actual Flow]: 1. open auth page -> 2. do auth -> 3. 3rd party service call back with user tokens
        // [Mocked Flow]: 1. mock 3rd party service call back with mock access code directly
        const url = process.env.MOCK_CALLBACK_URI;

        // TODO: When start actual development, replace mock code with below code so to activate [Actual Flow]
        // const url = oauthApp.code.getUri();

        // ===[MOCK_END]===
        res.redirect(url);
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
    const mockTokenResponse = {
        mockAccessToken: "mockAccessToken",
        mockRefreshToken: "mockRefreshToken"
    }
    const mockAccessToken = mockTokenResponse.mockAccessToken;
    const mockRefreshToken = mockTokenResponse.mockRefreshToken;

    // TODO: When start actual development, replace mock code with blow code so to exchange accessCode for tokens from 3rd party
    // const { accessToken } = await oauthApp.code.getToken(req.body.callbackUri);
    if (!mockAccessToken) {
        // ===[MOCK_END]===
        res.send('Params error');
        res.status(403);
        return;
    }
    console.log(`accessToken: ${mockAccessToken}`);
    try {
        // ===[MOCK]===
        // TODO: When start actual development, replace this with actual call to 3rd party service with access token, and retrieve user info
        const mockUserInfoResponse = {
            id: "user-123456"
        }
        let user = await User.findByPk(mockUserInfoResponse.id);
        // if existing user - we want to update tokens
        if (user) {
            user.tokens = {
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken
            };
            await user.save();
        }
        // if new user - we want to create it with tokens. Tokens will be used for future API calls
        else {
            await User.create({
                id: mockUserInfoResponse.id,
                tokens: {
                    accessToken: mockAccessToken,
                    refreshToken: mockRefreshToken
                },
                rcWebhookUri: req.body.rcWebhookUri
            });
        }
        // ===[MOCK_END]===

        // return jwt to client for future client-server communication
        const jwtToken = generateToken({ id: mockUserInfoResponse.id });
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

async function refreshAccessToken(user) {
    // ===[MOCK]===
    // TODO: When start actual development, replace mock code with below commented code
    // const token = oauthApp.createToken(user.tokens.accessToken, user.tokens.refreshToken);
    // const { accessToken, refreshToken } = await token.refresh();
    const mockRefreshResponse = {
        mockAccessToken: "newMockAccessToken",
        mockRefreshToken: "newMockRefreshToken"
    };
    user.tokens = {
        accessToken: mockRefreshResponse.mockAccessToken,
        refreshToken: mockRefreshResponse.mockRefreshToken
    };

    //===[MOCK_END]===
    await user.save();

    return user;
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
        if (user && user.tokens) {
            await user.destroy();
        }

        if (user.subscriptionId) {
            // ===[MOCK]===
            // We want to replace this one with the actual unsubscription action to 3rd party
            const mockUnsubscriptionResponse = {};
            // ===[MOCK_END]===
            const subscription = await Subscription.findByPk(user.subscriptionId);
            if (subscription) {
                await subscription.destroy();
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
exports.refreshAccessToken = refreshAccessToken;
exports.saveUserInfo = saveUserInfo;
exports.revokeToken = revokeToken;
exports.oauthCallback = oauthCallback;