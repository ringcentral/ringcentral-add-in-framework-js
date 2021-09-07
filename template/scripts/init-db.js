require('dotenv').config();
const fs = require('fs');
const { User } = require('../src/server/model/userModel');
<% if (useOAuth) { %>const { Subscription } = require('../src/server/model/subscriptionModel');<% } %>

async function initDB() {
  await fs.unlink(__dirname.replace('scripts', 'db.sqlite'), (err) => { });

  await User.sync();
  <% if (useOAuth) { %>await Subscription.sync();<% } %>
}

initDB();
