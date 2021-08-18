const axios = require('axios');
const { Subscription } = require('../db/subscriptionModel');
const { User } = require('../db/userModel');

async function notification(req, res) {
    try {
        const mockSubscriptionId = req.body.id;
        const subscription = await Subscription.findByPk(mockSubscriptionId);
        const mockUserId = subscription.userId;
        const user = await User.findByPk(mockUserId);

        const message = {
            title : req.body.message
        }
        await axios.post(user.rcWebhookUri, message, {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          });
    } catch (e) {
        console.error(e);
    }

    res.json({
      result: 'OK',
    });
    res.status(200);
}

exports.notification = notification;