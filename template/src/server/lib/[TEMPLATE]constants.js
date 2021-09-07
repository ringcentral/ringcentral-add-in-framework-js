const route = {
    forClient :{
        CLIENT_VIEW: '/view',
        <% if (useOAuth) { %>OPEN_AUTH_PAGE: '/open-auth-page',
        GET_USER_INFO: '/get-user-info',
        GENERATE_TOKEN: '/generate-token',
        REVOKE_TOKEN: '/revoke-token',
        SUBSCRIBE: '/subscribe'<% } %>
    },
    forThirdParty:{
        <% if (useOAuth) { %>AUTH_CALLBACK: '/oauth-callback',<% } %>
        NOTIFICATION: '/notification'
    }
}

exports.route = route;