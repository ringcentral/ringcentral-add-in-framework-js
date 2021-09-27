const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

// Model for User data
exports.User = sequelize.define('users', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },refreshToken: {
    type: Sequelize.STRING,
  },
  tokenExpiredAt:{
    type: Sequelize.DATE
  },
  email: {
    type: Sequelize.STRING,
  },
  name: {
    type: Sequelize.STRING,
  },
  rcUserId: {
    type: Sequelize.NUMBER,
  },
  accessToken: {
    type: Sequelize.STRING,
  }
});
