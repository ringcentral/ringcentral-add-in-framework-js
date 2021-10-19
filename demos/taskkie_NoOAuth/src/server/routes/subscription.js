const { Subscription } = require('../models/subscriptionModel');

async function subscribe(req, res) {
  // check for rcWebhookUri
  const rcWebhookUri = req.body.rcWebhookUri;
  if (!rcWebhookUri) {
    res.status(400);
    res.send('Missing rcWebhookUri');
    return;
  }

  // create webhook notification subscription
  try {
    // Get subscriptionId
    const subscriptionId = req.body.subscriptionId;

    // Create new subscription in DB
    await Subscription.create({
      id: subscriptionId,
      rcWebhookUri: req.body.rcWebhookUri,
    });

    res.status(200);
    res.json({
      result: 'ok',
    });
  } catch (e) {
    console.error(e);
    if (e.response && e.response.status === 401) {
      res.status(401);
      res.send('Unauthorized');
      return;
    }
    console.error(e);
    res.status(500);
    res.send('Internal server error');
    return;
  }
}

exports.subscribe = subscribe;
