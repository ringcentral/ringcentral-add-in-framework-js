const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

// Model for User data
exports.User = sequelize.define('users', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name:{
    type: Sequelize.STRING,
  },
  accessToken: {
    type: Sequelize.STRING,
  },
  rcWebhookUri:{
    type: Sequelize.STRING
  },
  subscriptionId: {
    type: Sequelize.STRING
  },
});
