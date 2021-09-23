const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

// Model for User data
exports.User = sequelize.define('users', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },<%if (useRefreshToken) {%>refreshToken: {
    type: Sequelize.STRING,
  },
  tokenExpiredAt:{
    type: Sequelize.DATE
  },<%}%>
  email: {
    type: Sequelize.STRING,
  },
  name: {
    type: Sequelize.STRING,
  },
  rcUserId: {
    type: Sequelize.STRING,
  },
  accessToken: {
    type: Sequelize.STRING,
  }
});
