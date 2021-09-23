const request = require('supertest');
const nock = require('nock');
const axios = require('axios');
const constants = require('../src/server/lib/constants');
const { server } = require('../src/server');
const { Subscription } = require('../src/server/models/subscriptionModel');

axios.defaults.adapter = require('axios/lib/adapters/http')

// Example tests
describe('Notification', () => {

    const mockDomain = 'http://test.com';
    const mockRcWebhookEndpoint = '/webhook';
    const mockGoodSubId = 'knownSubId';
    const mockBadSubId = 'unknownSubId';

    beforeAll(async () => {
        // Mock data on subscriptions table
        await Subscription.create({
            id: mockGoodSubId,
            rcWebhookUri: `${mockDomain}${mockRcWebhookEndpoint}`
        })
    });

    it('notification(): good subscriptionId - send adaptive card', async () => {
        // Arrange
        const scope = nock(mockDomain)
            .post(mockRcWebhookEndpoint)
            .reply(200, { result: 'OK' });
        let requestBody = null;
        scope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
            requestBody = JSON.parse(reqBody);
        });
        // Act
        const res = await request(server)
            .post(`${constants.route.forThirdParty.NOTIFICATION}?subscriptionId=${mockGoodSubId}`)
            .send({
                issue: {
                    title: '',
                    html_url: '',
                    state: '',
                    body: '',
                    number: '',
                    user: {
                        login: '',
                        html_url: ''
                    }
                },
                repository: {
                    full_name: '',
                    html_url: ''
                },
                action: 'opened'
            });
        // Assert
        expect(res.status).toEqual(200);
        expect(requestBody.attachments[0].type).toEqual('AdaptiveCard');
        scope.done();
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