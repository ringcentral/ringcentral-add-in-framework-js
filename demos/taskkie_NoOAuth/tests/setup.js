const { User } = require('../src/server/models/userModel');
const { Subscription } = require('../src/server/models/subscriptionModel');

jest.setTimeout(30000);

beforeAll(async () => {
  await User.sync();
  await Subscription.sync();
});
