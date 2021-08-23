require('dotenv').config();
const fs = require('fs');
const { User } = require('../src/server/db/userModel');
const { Subscription } = require('../src/server/db/subscriptionModel');

async function initDB() {
  await fs.unlink(__dirname.replace('scripts', 'db.sqlite'), (err) => { });

  await User.sync();
  await Subscription.sync();
}

initDB();
