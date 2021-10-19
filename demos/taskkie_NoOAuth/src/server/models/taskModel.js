const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

exports.Task = sequelize.define('tasks', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING,
  },
  description: {
    type: Sequelize.STRING,
  },
  assignee: {
    type: Sequelize.STRING,
  },
  image: {
    type: Sequelize.STRING,
  },
  deadline: {
    type: Sequelize.DATE,
  },
  subscriptionId: {
    type: Sequelize.STRING,
  },
});
