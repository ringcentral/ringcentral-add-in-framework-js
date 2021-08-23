const { User } = require('../db/userModel');
const { Subscription } = require('../db/subscriptionModel');
const { decodeToken, generateToken } = require('../lib/jwt');
const axios = require('axios');

async function openAuthPage(req, res) {
    try {
        // [Actual Flow]: 1. open auth page -> 2. do auth -> 3. 3rd party service call back with user tokens
        // ===[MOCK]===
        // [Mocked Flow]: 1. mock 3rd party service call back with mock user tokens
        // mockAuthCallback: it is to mock the callback action that happens after a successful auth
        // replace "mockAuthCallback(res, `xxx`);" with "res.redirect(authUrl);" so that it starts from step1: open auth page
        const authUrl = `${process.env.AUTH_URL}&client_id=${process.env.GITHUB_CLIENT_ID}`;
        res.redirect(authUrl);
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
    if (!code) {
        res.send('Params error');
        res.status(403);
        return;
    }
    try {
        // ===[MOCK]===
        // replace this with actual call to 3rd party service with access token, and retrieve user info
        const tokenRequest = {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code
        }
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', tokenRequest,
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            });
        const accessToken = tokenResponse.data.access_token;
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json'
            }
        });
        const userId = userResponse.data.id;
        const userName = userResponse.data.login;
        let user = await User.findByPk(userId);
        // if existing user - we want to update tokens
        if (user) {
            user.accessToken = accessToken;
            await user.save();
        }
        // if new user - we want to create it with tokens. Tokens will be used for future API calls
        else {
            await User.create({
                id: userId,
                name: userName,
                accessToken: accessToken,
                rcWebhookUri: req.body.rcWebhookUri
            });
        }

        // return jwt to client for future client-server communication
        const jwtToken = generateToken({ id: userId });
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
            // unsubscribe - This can be separated to subscription.js as a different method
            const webhookResponse = await axios.delete(`https://api.github.com/repos/${user.name}/${process.env.TEST_REPO_NAME}/hooks/${user.subscriptionId}`, {
                headers: {
                    Authorization: `Bearer ${user.accessToken}`,
                }
            });

            if(webhookResponse != null)
            {
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