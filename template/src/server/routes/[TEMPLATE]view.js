const constants = require('../lib/constants');

// RingCentral notification app developer tool calls this to pass in RC_WEBHOOK
async function clientView(req, res) {
    const rcWebhookUri = req.query.webhook;
    if (!rcWebhookUri) {
      res.status(404);
      res.send('Webhook uri is required.');
      return;
    }
    res.render('setup', {
      <% if (useOAuth) { %>assetsPath: process.env.ASSETS_PATH,<% } %>
      data: {
        rcWebhookUri,
        <% if (useOAuth) { %>authPageUri: `${process.env.APP_SERVER}${constants.route.forClient.OPEN_AUTH_PAGE}`,
        getUserInfoUri: `${process.env.APP_SERVER}${constants.route.forClient.GET_USER_INFO}`,
        generateTokenUri: `${process.env.APP_SERVER}${constants.route.forClient.GENERATE_TOKEN}`,
        authRevokeUri: `${process.env.APP_SERVER}${constants.route.forClient.REVOKE_TOKEN}`,
        subscribeUri : `${process.env.APP_SERVER}${constants.route.forClient.SUBSCRIBE}`<% } %>
      },
    });
  }
  
exports.clientView = clientView;