require('dotenv').config();
const { User } = require('../src/server/db/userModel');
const { Subscription } = require('../src/server/db/subscriptionModel');

async function initDB() {
  await User.sync();
  await Subscription.sync();
}

initDB();
