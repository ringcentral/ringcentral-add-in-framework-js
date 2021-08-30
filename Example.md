# Example for Asana Integration

This example is built based on `main` branch and intend to show basic integration with Asana Webhooks. Therefore this instruction will only show what changes have been done to adapt to Asana webhook rules.

Note: This example only demonstrates commit action notification subscription for a pre-defined Asana repository. Some implementations are intentionally done for the sake of simplicity.

# Try Example

This instruction assumes that you have already read the [framework instruction](/README.md).

## Step.1 Asana Registration

Register an app on Asana following [Instruction](https://app.asana.com/0/developer-console).

During Asana setup, let's fill `Redirect URLs` with `https://xxxxxxxx.ngrok.io/oauth-callback` (or go with a temporary one and update it after we do `npm run ngrok` and get our real server address).

Note: `Redirect URLs` is the auth-callback endpoint on our server. It is registered under your Asana app for creating a callback carrying access code (NOT access token.) to our server when user authorization is finished. The access code will then be exchanged for access token.

Do `cp .env.sample .env`

After the setup, we'll get `Client ID` and `Client Secret`. Let's copy them over to `.env` on `CLIENT_ID` and `CLIENT_SECRET`.

## Step.2 Local Setup

- `npm i`
- `npm run initDB`
- `npm run ngrok` and copy `https://xxxxxxxx.ngrok.io` to `APP_SERVER` in `.env`, and fill `Redirect URLs` with `https://xxxxxxxx.ngrok.io/oauth-callback`.
- Open a new terminal and `npm run start`
- Open another new terminal and `npm run client`

## Step.3 Use Developer Tool

- Go to [Developer Tool](https://ringcentral.Asana.io/ringcentral-notification-app-developer-tool/), fill in relevant info and do auth (details in [Framework Readme](README.md#step3-mock-subscription)). Note: the auth step will automatically create a subscription for `task name change` events under your Asana account.
- Change any of your task's name and there should be a message sent to your RingCentral App channel.
- Logout and do another task name change, there should be no message sent to your RingCentral App channel.

# Changes

Let's have a look at changes to implement the basic integration with Asana webhooks. It's recommended that you compare this branch with `main` to have a good overall view on what's changed.

Apart from `===[MOCK]===` tag places in: [authorization.js](./src/server/routes/authorization.js), [subscription.js](./src/server/routes/subscription.js) and [notification.js](./src/server/routes/notification.js), there is an additional change described as follow. (Note: all `===[MOCK]===` tags areas are changed, but comments are still kept as reference)

## Database - User Model

Asana OAuth `accessToken` has 3600 seconds expiry. There are different methods we could apply to do token refresh. What I did here was keeping a record of `accessToken` creation date and refresh when it's over 3600 seconds.

# Additional Resource
- [Asana npm package]()
- [Asana OAuth and Scopes](https://developers.asana.com/docs/oauth)