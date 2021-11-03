require('dotenv').config();
const fs = require('fs');
const { User } = require('../src/server/models/userModel');
const { Subscription } = require('../src/server/models/subscriptionModel');

async function refreshDB() {
  await fs.unlink(__dirname.replace('scripts', 'db.sqlite'), (err) => { });

  await User.sync();
  await Subscription.sync();
}

refreshDB();
