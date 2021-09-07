const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

// Model for Subscription data
exports.Subscription = sequelize.define('subscriptions', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  thirdPartyWebhookId:{ // Note: this is not needed if we use 3rd party webhook id as our primary id here
    type: Sequelize.STRING,
  },
  userId: {
    type: Sequelize.STRING
  },
  rcWebhookUri:{
    type: Sequelize.STRING
  },
});
