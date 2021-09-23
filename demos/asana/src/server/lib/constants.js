const route = {
    forClient :{
        CLIENT_SETUP: '/setup',
        SUBSCRIBE: '/subscribe',
        OPEN_AUTH_PAGE: '/open-auth-page',
        GET_USER_INFO: '/get-user-info',
        GENERATE_TOKEN: '/generate-token',
        REVOKE_TOKEN: '/revoke-token'
    },
    forThirdParty:{
        AUTH_CALLBACK: '/oauth-callback',
        NOTIFICATION: '/notification',
        INTERACTIVE_MESSAGE: '/interactive-messages',
    }
}

exports.route = route;