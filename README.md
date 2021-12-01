# [RingCentral Add-In Framework](https://github.com/ringcentral/ringcentral-add-in-framework-js)

[![Build Status](https://github.com/ringcentral/ringcentral-add-in-framework-js/actions/workflows/release.yaml/badge.svg)](https://github.com/ringcentral/ringcentral-add-in-framework-js/actions)
[![Latest release](https://img.shields.io/github/v/release/ringcentral/ringcentral-add-in-framework-js)](https://github.com/ringcentral/ringcentral-add-in-framework-js/releases)


The framework will help you create a [RingCentral Add-In App](https://developers.ringcentral.com/guide/team-messaging/add-ins) that subscribes to 3rd party notifications via webhook and forward incoming notifications from 3rd party server to RingCentral App.

# Prerequisites

- Download and install RingCentral App and login: https://www.ringcentral.com/apps/rc-app
- Nodejs and npm.

# Framework

This framework should be used as a boilerplate project. There are two types of Add-Ins that can be installed with this framework:
- Notification App
- Bot

## Notification App

<details>
  <summary>How to install a notification app template/demo</summary>

### Install Notification App Template

This framework contains several app template variations due to the fact that different 3rd party platforms have different designs on their APIs. Before starting the installation, please:
1. Go to 3rd party platform and register a new app there. For most platforms who have OAuth flow implementation, there will be `ClientId` and `ClientSecret` generated for your app.
2. If 3rd party platform uses `OAuth`, please check if it uses `accessToken` + `refreshToken` OR just `accessToken`.
3. If 3rd party platform uses `OAuth`, please find their API endpoints for authorization and access token exchange.
   
Then install a `app-template` with following commands:

```bash
npx ringcentral-add-in-framework app-template

OR

npx ringcentral-add-in-framework at
```

We also have simple `app-demo` that are based on the template and they'll be up and running with a few steps to configure. Demos can be installed with:

```bash
npx ringcentral-add-in-framework app-demo

OR

npx ringcentral-add-in-framework ad
```
</details>

<details>
  <summary>How to use a notification app template</summary>

### Use Notification App Template

To work with a plain `app-template`, we want to fill in our business logic in handlers which are for:
- Authorization (authorize Add-In server with user's 3rd party platform account)
- Subscription (create event subscription on 3rd party platform)
- Notification (receive and format data from 3rd party platform when subscribed events happen)

### Coding

Please follow the steps inside the handlers. For example, authorization handler in `template` looks like:

```javascript
// Step.1: Get user info from 3rd party API call
const userInfoResponse = { id: "id", email: "email", name: "name"}   // [REPLACE] this line with actual call
const userId = userInfoResponse.id; // [REPLACE] this line with user id from actual response
// Find if it's existing user in our database
let user = await User.findByPk(userId);
// Step.2: If user doesn't exist, we want to create a new one
if (!user) {
    user = await User.create({
        id: userId,
        accessToken: accessToken,
        refreshToken: refreshToken,
        tokenExpiredAt: expires,
        email: userInfoResponse.email, // [REPLACE] this with actual user email in response, [DELETE] this line if user info doesn't contain email
        name: userInfoResponse.name, // [REPLACE] this with actual user name in response, [DELETE] this line if user info doesn't contain name
    });
}
```

Focus on `[REPLACE]` and `[DELETE]` tags. If we want to integrate Asana, then it'd be:

```javascript
// Step1: Get user info from 3rd party API call
const client = Asana.Client.create().useAccessToken(accessToken); // create Asana client object
const userInfo = await client.users.me();   // call Asana to get user info
const userId = userInfo.gid; // get user id
// Find if it's existing user in our database
let user = await User.findByPk(userId);
// Step2: If user doesn't exist, we want to create a new one
if (!user) {
    await User.create({
        id: userId,
        accessToken: accessToken,
        refreshToken: refreshToken,
        tokenExpiredAt: expires
    });
}
```

</details>

<details>
  <summary>How to use a notification app demo</summary>

### Use Notification App Demo

It's a lot easier than using a `template`, and `demos` are essentially `templates` with platform-dependent logic written to implement simple functionality. Therefore a few cli commands would make it up and run.

At the moment, we have `demos` for `Github`, `Asana` and `Gitlab`.

</details>

## Bot
<details>
  <summary>How to install a bot template</summary>

### Install Bot Template

To install a `bot-template`, use:

```bash
npx ringcentral-add-in-framework bot-template

OR

npx ringcentral-add-in-framework bt
```
</details>

<details>
  <summary>How to use a bot template</summary>

### Quick Try
A `bot-template` would be up-and-running without any extra code. Here's how:

1. run `npm i` and then `npm run ngrok`. We'll get `https://xxxxxx.ngrok.io` as our server address.
2. Create a Bot Add-In on developer.ringcentral.com, and go to app settings. (Additional Info on creating a bot: https://developers.ringcentral.com/guide/team-messaging/bots/walkthrough)
   1. OAuth Redirect URI: `https://xxxxxx.ngrok.io/bot/oauth`
   2. App Permissions: Read Messages, Read Accounts, Team Messaging, Webhook Subscriptions, Edit Messages
   3. Outbound Webhook URL: `https://xxxxxx.ngrok.io/interactive-messages`
   4. Note down `SharedSecret`
3. We'll also get `ClientId` and `ClientSecret` for the app after created. Let's then fill in `.env` file with:

```bash
RINGCENTRAL_CHATBOT_SERVER=https://xxxxxxx.ngrok.io

RINGCENTRAL_CHATBOT_CLIENT_ID={ClientId}

RINGCENTRAL_CHATBOT_CLIENT_SECRET={ClientSecret}

RINGCENTRAL_SERVER=https://platform.devtest.ringcentral.com

RINGCENTRAL_CHATBOT_EXPRESS_PORT=6066

RINGCENTRAL_CHATBOT_DATABASE_CONNECTION_URI=sqlite://./db.sqlite

# Credentials for admin actions
RINGCENTRAL_CHATBOT_ADMIN_USERNAME=admin
RINGCENTRAL_CHATBOT_ADMIN_PASSWORD=password

# RingCentral Add-In App interactive message shared secret
RINGCENTRAL_SHARED_SECRET={SharedSecret}
```

4. Open another terminal and run `npm run start`
5. On developer portal, go to your bot app's `Bot` tab and do `Add To RingCentral`
6. Go to `https://app.devtest.ringcentral.com` to test it with direct message or @{yourBotName} in a team conversation with command `hello` and `card`

### Development

New bot command, in `src/handlers/botHandler.js`, add a new `case`:

```javascript
case 'new command':
    // send text
    const myText = '';
    await bot.sendMessage(group.id, { text: myText });
    // Or, send adaptive card. Here we use adaptive card template package, please refer to the use of it in the template
    // https://adaptivecards.io/designer/ is a great tool to design your card
    const card = {};
    await bot.sendAdaptiveCard(group.id, card);
```

</details>

<br>

# Detailed Info

For further Information, please refer to the `README.md` that's inside your generated template or demo and [RingCentral App Developer Guide](https://developers.ringcentral.com/guide/applications)
