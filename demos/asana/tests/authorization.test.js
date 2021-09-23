const request = require('supertest');
const axios = require('axios');
const constants = require('../src/server/lib/constants');
const { server } = require('../src/server');
const { generateJwt } = require('../src/server/lib/jwt');

axios.defaults.adapter = require('axios/lib/adapters/http')

// Example tests
describe('Authorization', () => {
    it('getUserInfo(): no jwt - 403', async () => {
        // Arrange
        const jwt = '';
        // Act
        const res = await request(server).get(`${constants.route.forClient.GET_USER_INFO}?token=${jwt}`);
        // Assert
        expect(res.status).toEqual(403);
    });
    it('getUserInfo(): bad jwt - 401', async () => {
        // Arrange
        const jwt = 'test';
        // Act
        const res = await request(server).get(`${constants.route.forClient.GET_USER_INFO}?token=${jwt}`);
        // Assert
        expect(res.status).toEqual(401);
    });
    it('getUserInfo(): unknown user - 200', async () => {
        // Arrange
        const userId = 'user1';
        const jwt = generateJwt({ id: userId });
        // Act
        const res = await request(server).get(`${constants.route.forClient.GET_USER_INFO}?token=${jwt}`);
        // Assert
        expect(res.status).toEqual(200);
        expect(res.body.user).toEqual(null);
        expect(res.body.hasSubscription).toEqual(false);
    });
});