const route = {
    forClient :{
        CLIENT_SETUP: '/setup',
        SUBSCRIBE: '/subscribe',
        <% if (useOAuth) { %>OPEN_AUTH_PAGE: '/open-auth-page',
        GET_USER_INFO: '/get-user-info',
        GENERATE_TOKEN: '/generate-token',
        REVOKE_TOKEN: '/revoke-token'<% } %>
    },
    forThirdParty:{<% if (useOAuth) { %>
        AUTH_CALLBACK: '/oauth-callback',<% } %>
        NOTIFICATION: '/notification',
        INTERACTIVE_MESSAGE: '/interactive-messages',
    }
}

exports.route = route;