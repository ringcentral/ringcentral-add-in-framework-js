const request = require('supertest');
const { server } = require('../src/server');
const { default: Bot } = require('ringcentral-chatbot-core/dist/models/Bot');
const { TestModel } = require('../src/models/testModel');
const nock = require('nock');


const groupId = 'groupId';
const accessToken = 'accessToken';
const botId = 'botId';
const rcUserId = 'rcUserId';
const cardId = 'cardId';
const testId = 'testId';
const testName = 'testName';

beforeAll(async () => {
    await Bot.create({
        id: botId,
        token: {
            access_token: accessToken
        }
    })
    await TestModel.create({
        id: testId,
        name: testName
    })
});

afterAll(async () => {
    await Bot.destroy({
        where: {
            id: botId
        }
    });
    await TestModel.destroy({
        where: {
            id: testId
        }
    });
})

describe('cardHandler', () => {
    describe('validations', () => {
        test('unknown bot id - 400', async () => {
            // Arrange
            const postData = {
                data: {
                    botId: 'unknownBotId'
                },
                user: {},
                card: {
                    id: cardId
                }
            }

            // Act
            const res = await request(server).post('/interactive-messages').send(postData)

            // Assert
            expect(res.status).toEqual(400);
            expect(res.text).toEqual('Unknown Bot Id.');
        })
    });

    describe('update card', () => {
        test('return the updated card', async () => {
            // Arrange
            let requestBody = null;
            const updatedCardScope = nock(process.env.RINGCENTRAL_SERVER)
                .persist()
                .put(`/restapi/v1.0/glip/adaptive-cards/${cardId}`)
                .reply(200, 'OK');

            const postData = {
                data: {
                    botId,
                    actionType: 'update',
                    testId,
                    testName: 'new name'
                },
                user: {
                    extId: rcUserId
                },
                conversation: {
                    id: groupId
                },
                card: {
                    id: cardId
                }
            }
            updatedCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
                requestBody = JSON.parse(reqBody);
            });

            // Act
            const res = await request(server).post('/interactive-messages').send(postData)

            // Assert
            expect(res.status).toEqual(200);

            expect(requestBody.type).toBe('AdaptiveCard');
            expect(requestBody.body[0].text).toBe('Name Updated');

            const updatedTestModel = await TestModel.findByPk(testId);
            expect(updatedTestModel.name).toBe('new name');

            // Clean up
            updatedCardScope.done();
        });
    })
});