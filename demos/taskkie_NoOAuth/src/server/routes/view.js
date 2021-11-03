const constants = require('../lib/constants');
const { generate } = require('shortid');

// RingCentral notification app developer tool calls this to pass in RC_WEBHOOK

async function setup(req, res) {
  const rcWebhookUri = req.query.webhook;
  const subscriptionId = generate();
  res.render('setup', {
    data: {
      rcWebhookUri,
      subscriptionId: subscriptionId,
      subscriptionUrl: `${process.env.APP_SERVER}${constants.route.forClient.SUBSCRIBE}`,
      taskUrl: `${process.env.APP_SERVER}${constants.route.forThirdParty.NOTIFICATION}?subscriptionId=${subscriptionId}`,
    },
  });
}

exports.setup = setup;
