require('dotenv').config();
const { Task } = require('../src/server/models/taskModel');
const { Subscription } = require('../src/server/models/subscriptionModel');

async function initDB() {
  await Task.sync();
  await Subscription.sync();
}

initDB();
