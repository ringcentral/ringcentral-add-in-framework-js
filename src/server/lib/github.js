const { OAuthApp } = require("@octokit/oauth-app");
const { Octokit } = require('@octokit/rest');

const oauthApp = new OAuthApp({
    clientType: "oauth-app",
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
});

function getOAuthApp() {
    return oauthApp;
}

function getOctokit(accessToken) {
    const octokit = new Octokit({
        auth: accessToken
    });
    return octokit;
}

exports.getOAuthApp = getOAuthApp;
exports.getOctokit = getOctokit;