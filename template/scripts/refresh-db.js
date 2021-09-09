require('dotenv').config();
const fs = require('fs');
const { User } = require('../src/server/model/userModel');
const { Subscription } = require('../src/server/model/subscriptionModel');

async function refreshDB() {
  await fs.unlink(__dirname.replace('scripts', 'db.sqlite'), (err) => { });

  await User.sync();
  await Subscription.sync();
}

refreshDB();
