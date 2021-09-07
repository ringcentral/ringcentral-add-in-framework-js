const { User } = require('../model/userModel');
const constants = require('./constants');
const ClientOAuth2 = require('client-oauth2');

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

const SECOND_TO_MILLISECOND = 1000;

async function checkAndRefreshAccessToken(userId) {
    const user = await User.findByPk(userId);
    const dateNow = new Date();
    if ((dateNow - user.tokenCreatedDate) > (process.env.ACCESS_TOKEN_EXPIRY_IN_SEC * SECOND_TO_MILLISECOND)) {
        const token = oauthApp.createToken(user.accessToken, user.refreshToken);
        const { accessToken, refreshToken } = await token.refresh();
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        user.tokenCreatedDate = dateNow;
        await user.save();
    }
}

exports.checkAndRefreshAccessToken = checkAndRefreshAccessToken;