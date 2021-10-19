const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');
const { generate } = require('shortid');

// Model for Subscription data
exports.Subscription = sequelize.define('subscriptions', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    default: generate,
  },
  rcWebhookUri: {
    type: Sequelize.STRING,
  },
});
