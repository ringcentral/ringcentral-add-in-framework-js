const { default: Bot } = require('ringcentral-chatbot-core/dist/models/Bot');
const { TestModel } = require('../src/models/testModel');

jest.setTimeout(30000);

beforeAll(async () => {
  await Bot.sync();
  await TestModel.sync();
});
