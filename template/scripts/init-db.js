require('dotenv').config();
const fs = require('fs');
const { User } = require('../src/server/model/userModel');
const { Subscription } = require('../src/server/model/subscriptionModel');

async function initDB() {
  await User.sync();
  await Subscription.sync();
}

initDB();
