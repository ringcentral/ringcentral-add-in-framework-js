const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

// Model for Subscription data
exports.Subscription = sequelize.define('subscriptions', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  userId: {
    type: Sequelize.STRING
  },
});
