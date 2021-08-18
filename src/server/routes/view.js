const constants = require('../lib/constants');

// RingCentral notification app developer tool calls this to pass in RC_WEBHOOK
async function clientView(req, res) {
    const rcWebhookUri = req.query.webhook;
    if (!rcWebhookUri || rcWebhookUri.indexOf('https://') !== 0) {
      res.send('Webhook uri is required.');
      res.status(404);
      return;
    }
    res.render('new', {
      assetsPath: process.env.ASSETS_PATH,
      data: {
        rcWebhookUri,
        authPageUri: `${process.env.APP_SERVER}${constants.route.forClient.OPEN_AUTH_PAGE}`,
        getUserInfoUri: `${process.env.APP_SERVER}${constants.route.forClient.GET_USER_INFO}`,
        saveUserInfoUri: `${process.env.APP_SERVER}${constants.route.forClient.SAVE_USER_INFO}`,
        authRevokeUri: `${process.env.APP_SERVER}${constants.route.forClient.REVOKE_TOKEN}`,
        subscribeUri : `${process.env.APP_SERVER}${constants.route.forClient.SUBSCRIBE}`
      },
    });
  }
  
exports.clientView = clientView;