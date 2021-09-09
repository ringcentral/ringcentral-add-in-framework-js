const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

// Model for User data
exports.User = sequelize.define('users', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },<%if (useOAuth) {%>
  name: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
  },
  <%if (useRefreshToken) {%>refreshToken: {
    type: Sequelize.STRING,
  },
  tokenCreatedDate:{
    type: Sequelize.DATE
  },<%}%>
  accessToken: {
    type: Sequelize.STRING,
  }<%}%>
});
