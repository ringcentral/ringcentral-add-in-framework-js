require('dotenv').config();
const fs = require('fs');
const { Task } = require('../src/server/models/taskModel');
const { Subscription } = require('../src/server/models/subscriptionModel');

async function refreshDB() {
  await fs.unlink(__dirname.replace('scripts', 'db.sqlite'), (err) => {});

  await Task.sync();
  await Subscription.sync();
}

refreshDB();
