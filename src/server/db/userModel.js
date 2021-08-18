const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

// Model for User data
exports.User = sequelize.define('users', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  token: {
    type: Sequelize.STRING
  },
  rcWebhookUri:{
    type: Sequelize.STRING
  }
});
