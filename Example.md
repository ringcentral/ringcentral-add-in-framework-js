# Example for Github Integration

This example is built based on `main` branch and intend to show basic integration with Github Webhooks. Therefore this instruction will only show what changes have been done to adapt to Github webhook rules.

Note: This example only demonstrates commit action notification subscription for a pre-defined Github repository. Some implementations are intentionally done for the sake of simplicity.

# Try Example

This instruction assumes that you have already read the [framework instruction](/README.md).

## Step.1 Github Registration

Register an app on Github following [Instruction](https://docs.github.com/en/rest/guides/basics-of-authentication#registering-your-app).

During the setup, let's fill `Authorization callback URL` with `https://xxxxxxxx.ngrok.io/oauth-callback` (or go with a temporary one and update it after we do `npm run ngrok` and get our real server address). `Homepage URL` isn't important, you can fill in a dummy url.

Note: `Authorization callback URL` is the auth-callback endpoint on our server. It is registered under your Github app for creating a callback carrying access code (NOT access token.) to our server when user authorization is finished. The access code will then be exchanged for access token.

Do `cp .env.sample .env`

After the setup, we'll get `Client ID` and `Client Secret`. Let's copy them over to `.env` on `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

## Step.2 Local Setup

- `npm i`
- `npm run initDB`
- `npm run ngrok` and copy `https://xxxxxxxx.ngrok.io` to `APP_SERVER` in `.env`, and fill `Authorization callback URL` with `https://xxxxxxxx.ngrok.io/oauth-callback`. Pick a repository you want to subscribe and copy its name (ONLY plain repo name, don't include user path) to `TEST_REPO_NAME` in `.env`.
- Open a new terminal and `npm run start`
- Open another new terminal and `npm run client`

## Step.3 Use Developer Tool

- Go to [Developer Tool](https://ringcentral.github.io/ringcentral-notification-app-developer-tool/), fill in relevant info and do auth (details in [Framework Readme](README.md#step3-mock-subscription)). Note: the auth step will automatically create a subscription for `push` events under your repository.
- Go to your repository's Settings page and check if there's a webhook created.
- Push a commit to your Github repository and there should be a message sent to your RingCentral App channel.
- Logout and do another push, there should be no message sent to your RingCentral App channel.

![](./diagram/github-webhook.png)

# Understand Changes

Let's have a look at changes to implement the basic integration with Github webhooks. It's recommended that you compare this branch with `main` to have a good overall view on what's changed.

Apart from `===[MOCK]===` tag places in: [client.js](./src/client/lib/client.js), [authorization.js](./src/server/routes/authorization.js), [subscription.js](./src/server/routes/subscription.js) and [notification.js](./src/server/routes/notification.js), there are two major changes described as follow.

## New Script - github.js

[github.js](./src/server/lib/github.js) is created to provide Github auth and API functionalities. It uses npm packages [@octokit/oauth-app](https://www.npmjs.com/package/@octokit/oauth-app) for auth and [@octokit/rest](https://www.npmjs.com/package/@octokit/rest) for other API calls (in this demo, they are Create Repository Webhook and Delete Repository Webhook).

## Database - User Model

Typically, OAuth should have access_token and refresh_token for security reason. Github here only has access_token, `tokens` is replaced with `accessToken` in [userModel.js](./src/server/db/userModel.js). Also, `name` is added because Github locates a repository with owner's name rather than owner's id.

# Additional Resource
- [Github Auth Scopes](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)
- [Octokit Rest JS Documentation](https://octokit.github.io/rest.js/v18/)