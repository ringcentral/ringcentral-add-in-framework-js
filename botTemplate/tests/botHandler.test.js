const { default: Bot } = require('ringcentral-chatbot-core/dist/models/Bot');
const { botHandler } = require('../src/handlers/botHandler');
const nock = require('nock');

const botId = 'botId';
const groupId = 'groupId';
const rcUserId = 'rcUserId';
const unknownRcUserId = 'unknownRcUserId';

const postScope = nock(process.env.RINGCENTRAL_SERVER)
    .persist()
    .post(`/restapi/v1.0/glip/groups/${groupId}/posts`)
    .reply(200, 'OK');

beforeAll(async () => {
    await Bot.create({
        id: botId,
        token: {
            access_token: 'accessToken'
        }
    });
});

afterAll(async () => {
    await Bot.destroy({
        where: {
            id: botId
        }
    });
})

describe('botHandler', () => {

    describe('bot join group', () => {
        test('show welcome message', async () => {
            // Arrange
            let requestBody = null;
            const bot = await Bot.findByPk(botId);
            const event = {
                type: "BotJoinGroup",
                userId: unknownRcUserId,
                bot,
                group: {
                    id: "groupId"
                }
            }
            postScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
                requestBody = JSON.parse(reqBody);
            });

            // Act
            await botHandler(event);

            // Assert
            expect(requestBody.text).toBe('welcome');
        });
    });

    describe('@bot hello', () => {
        test('return hello message', async () => {
            // Arrange
            let requestBody = null;
            const bot = await Bot.findByPk(botId);
            const event = {
                type: "Message4Bot",
                text: "hello",
                userId: rcUserId,
                bot,
                group: {
                    id: "groupId"
                }
            }
            postScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
                requestBody = JSON.parse(reqBody);
            });

            // Act
            await botHandler(event);

            // Assert
            expect(requestBody.text).toBe('hello');
        });
    });
});