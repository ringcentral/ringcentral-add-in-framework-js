const route = {
    forClient :{
        CLIENT_VIEW: '/view',
        OPEN_AUTH_PAGE: '/open-auth-page',
        GET_USER_INFO: '/get-user-info',
        SAVE_USER_INFO: '/save-user-info',
        REVOKE_TOKEN: '/revoke-token',
        SUBSCRIBE: '/subscribe'
    },
    forThirdParty:{
        AUTH_CALLBACK: '/oauth-callback',
        NOTIFICATION: '/notification'
    }
}

const oauth = {
    tokenExpiry : 3600000 // in ms
}

exports.route = route;
exports.oauth = oauth;