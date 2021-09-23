const request = require('supertest');
const nock = require('nock');
const axios = require('axios');
const constants = require('../src/server/lib/constants');
const { server } = require('../src/server');
const { Subscription } = require('../src/server/models/subscriptionModel');
const { User } = require('../src/server/models/userModel');

axios.defaults.adapter = require('axios/lib/adapters/http')

// Example tests
describe('Notification', () => {

    const mockDomain = 'http://test.com';
    const mockRcWebhookEndpoint = '/webhook';
    const mockGoodSubId = 'knownSubId';
    const mockBadSubId = 'unknownSubId';
    const userId = 'knownUserId';

    const asanaDomain = 'https://app.asana.com';
    const asanaUserEndpoint = '/api/1.0/users/';
    const asanaTaskEndpoint = '/api/1.0/tasks/';

    beforeAll(async () => {
        // Mock data on subscriptions table
        await Subscription.create({
            id: mockGoodSubId,
            rcWebhookUri: `${mockDomain}${mockRcWebhookEndpoint}`,
            userId: userId
        });
        await User.create({
            id: userId,
            accessToken: 'token'
        })
    });

    it('notification(): good subscriptionId - send adaptive card', async () => {
        // Arrange
        const scope = nock(mockDomain)
            .post(mockRcWebhookEndpoint)
            .reply(200, { result: 'OK' });

        const asanaUserScope = nock(asanaDomain)
            .get(asanaUserEndpoint)
            .reply(200, {
                data: {
                    name: '',
                    email: ''
                }
            });

        const asanaTaskScope = nock(asanaDomain)
            .get(asanaTaskEndpoint)
            .reply(200, {
                data: {
                    name: '',
                    permalink_url: '',
                    gid: ''
                }
            });

        let requestBody = null;
        scope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
            requestBody = JSON.parse(reqBody);
        });

        // Act
        const res = await request(server)
            .post(`${constants.route.forThirdParty.NOTIFICATION}?subscriptionId=${mockGoodSubId}`)
            .send({
                events: [
                    {
                        user: {
                            gid: ''
                        },
                        resource: {
                            gid: ''
                        }
                    }
                ]
            });
        // Assert
        expect(res.status).toEqual(200);
        expect(requestBody.attachments[0].type).toEqual('AdaptiveCard');
        scope.done();
        asanaUserScope.done();
        asanaTaskScope.done();
    });

    it('notification(): bad subscriptionId - ', async () => {
        // Act
        const res = await request(server)
            .post(`${constants.route.forThirdParty.NOTIFICATION}?subscriptionId=${mockBadSubId}`)
            .send({});
        // Assert
        expect(res.status).toEqual(403);
    });
});