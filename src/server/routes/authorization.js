const { User } = require('../db/userModel');
const { Subscription } = require('../db/subscriptionModel');
const { decodeToken, generateToken } = require('../lib/jwt');
const constants = require('../lib/constants');

async function openAuthPage(req, res) {
    try {
        // ===[Replace]===
        // replace this with actual auth page url from 3rd party service
        // Note1: this mockAuthUrl directly triggers a successful auth callback event with mock access token
        // Note2: for most 3rd party services, you'll also want to define your scopes in the auth call
        const mockService = {
            mockAuthUrl : `${process.env.APP_SERVER}${constants.route.forThirdParty.AUTH_CALLBACK}?accessToken=testAccessToken&refreshToken=testRefreshToken`
        };
        res.redirect(mockService.mockAuthUrl);
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
    // ===[Replace]===
    // replace this with logic to get real tokens from 3rd party callback
    const mockAccessToken = req.body.mockAccessToken;
    const mockRefreshToken = req.body.mockRefreshToken;
    if (!mockAccessToken) {
        res.send('Params error');
        res.status(403);
        return;
    }
    try {
        // ===[Replace]===
        // replace this with actual call to 3rd party service with access token, and retrieve user info
        const mockUserInfoResponse = {
            id : "user-123456"
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

        if(user.subscriptionId)
        {
            const subscription = await Subscription.findByPk(user.subscriptionId);
            if(subscription)
            {
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
exports.saveUserInfo = saveUserInfo;
exports.revokeToken = revokeToken;
exports.oauthCallback = oauthCallback;