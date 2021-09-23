const constants = require('../lib/constants');
<% if (!useOAuth) { %>const { generate } = require('shortid');<% } %>

// RingCentral notification app developer tool calls this to pass in RC_WEBHOOK
<% if (useOAuth) { %>
async function setup(req, res) {
    const rcWebhookUri = req.query.webhook;
    res.render('setup', {
      assetsPath: process.env.ASSETS_PATH,
      data: {
        rcWebhookUri,
        authPageUri: `${process.env.APP_SERVER}${constants.route.forClient.OPEN_AUTH_PAGE}`,
        getUserInfoUri: `${process.env.APP_SERVER}${constants.route.forClient.GET_USER_INFO}`,
        generateTokenUri: `${process.env.APP_SERVER}${constants.route.forClient.GENERATE_TOKEN}`,
        authRevokeUri: `${process.env.APP_SERVER}${constants.route.forClient.REVOKE_TOKEN}`,
        subscribeUri : `${process.env.APP_SERVER}${constants.route.forClient.SUBSCRIBE}`
      },
    });
}
<%} else {%>
async function setup(req, res) {
  const rcWebhookUri = req.query.webhook;
  const subscriptionId = generate();
  res.render('setup', {
    data: {
      rcWebhookUri,
      subscriptionId: subscriptionId,
      subscriptionUrl : `${process.env.APP_SERVER}${constants.route.forClient.SUBSCRIBE}`,
      notificationUrl : `${process.env.APP_SERVER}${constants.route.forThirdParty.NOTIFICATION}?subscriptionId=${subscriptionId}`
    },
  });
}
<%}%>
exports.setup = setup;