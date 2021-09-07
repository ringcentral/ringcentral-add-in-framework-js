const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

// Model for User data
exports.User = sequelize.define('users', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: {
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
  },
  <%if (useOAuth) 
  {%>email: {
    type: Sequelize.STRING,
  }<%}%>
});
