# RingCentral-Add-In-Framework

This template aims to help you quickly set up your app with 3rd party webhook integration.

# Prerequisites

- Download and install RingCentral App and login: https://www.ringcentral.com/apps/rc-app
- Nodejs and npm.

# How It Works

There are 3 major parts involved:
- Setup:
  - Get RingCentral App info
  - Auth on 3rd party and subscribe to events
- Use:
  - Process and forward 3rd party event notifications to RingCentral App via webhook
- Revoke:
  - Unsubscribe and clear user info

# Workflow Diagram

Note: if you don't have Markdown view, please open the flow diagram directly from `diagram/flow.svg`.

![flow](./diagram/flow.svg)

# Development

## Step.1 Start Web Tunnel

```bash
# install dependencies
npm i

# create db file - additional note: 'npm run refreshDB' command will clear DB and re-init it
npm run initDB 

# start proxy server, this will allow your local bot server to be accessed by the RingCentral service
npm run ngrok

# will show
Forwarding                    https://xxxx.ngrok.io -> localhost:6066
# Remember the https://xxxx.ngrok.io, we will use it later
```

ngrok will expose your local server to a public address where you can have other services interact with it.

Note: your local firewall might block certain ngrok regions. If so, try changing `ngrok http -region us 6066` in `package.json` to [other regions](https://www.google.com/search?q=ngrok+regions).

## Step.2 Set Up Environment Info

There are several OAuth-related fields in `.env` need to be set. They can be found on your target 3rd party platform docs.

```bash
# .env file
APP_SERVER= # Copy `https://xxxx.ngrok.io` from last step

CLIENT_ID=
CLIENT_SECRET=
ACCESS_TOKEN_URI=
AUTHORIZATION_URI=
SCOPES= # if SCOPES_SEPARATOR is ',', then SCOPES will be something like scope1,scope2,scope3
SCOPES_SEPARATOR=, # this field is default to ',', but can be changed

IM_SHARED_SECRET= # can be found on developer portal, under App Settings
```

## Step.3 Coding

There are several spots that need your input.

- In `src/server/routes/authorization.js`, follow steps in function `generateToken` and `revokeToken` .
- In `src/server/routes/subscription.js`, follow steps in function `subscribe`.
- In `src/server/routes/notification.js`, follow steps in function `notification` and `interactiveMessages`.
- You'll also need to customize your own [Adaptive Cards](https://adaptivecards.io/) in `src/server/lib/adaptiveCard.js`. There are two samples given.

## Step.4 Run It Locally

```bash
# open a new terminal
# start local server
npm run start

# open another new terminal
# start client app
npm run client
```

For local development, we can use [RingCentral notification app developer tool](https://ringcentral.github.io/ringcentral-notification-app-developer-tool/) to simulate RingCentral App Gallery shell which handles communications between your app and RingCentral server.

!!!Important note: [RingCentral notification app developer tool](https://ringcentral.github.io/ringcentral-notification-app-developer-tool/) doesn't provide the environment for `interactiveMessages`. To have a test environment for that, you will need to [create your sandbox app](#register-app-on-ringcentral-developer-website) on [RingCentral Developer Portal](https://developers.ringcentral.com/login.html#/) (Add-In is currently in beta, so you want to join beta on the same web page).

To use above tool, there are two fields we want to fill in:

1. `App Url`: It is for this tool to retrieve the app's entry point to render. In our framework, it's set to `https://xxxx.ngrok.io/view`
2. `Webhook Url`, there are 2 ways:
   1. Click `Get a webhookUrl` and login to your RingCentral App. Generate webhook url from your Team channel.
   2. Go to RingCentral App Gallery and add Incoming Webhook App to your conversation channel. As a result, you will get a webhook URL like `https://hooks.glip.com/webhook/xxxxx` (aka `RC_WEBHOOK`) and that's what we need here.

Now press `Apply` ([workflow 1-2](#workflow-diagram)). We should be able to see the UI button gets rendered in top block.

Refer to [Workflow Diagram](#workflow-diagram), sections are explained with user actions as below:

- `Authorization` ([workflow 3-7](#workflow-diagram)): Press `Connect to 3rd Party Service and Subscribe`. And do authorization on a new page rendered by 3rdp arty service.
- `Subscription` ([workflow 8-11](#workflow-diagram)): Upon the close of auth page, the framework will automatically trigger subscription creation (in practice, it's recommended to create a separate flow for auth and subscription).
- `Notification` ([workflow 12-15](#workflow-diagram)): Once the subscription is created, notifications from 3rd party service should be sent to our endpoint on `https://xxxx.ngrok.io/notification`. And notification data will be transformed and sent to RingCentral App.
- `Interactive Message` ([workflow 16-30](#workflow-diagram)): Any user in RingCentral App conversation who has the 3rd party account would be able to perform actions within RingCentral App. New users will need to authorize first.
- `Revoke` ([workflow 31-33](#workflow-diagram)): Press `Unsubscribe and Logout`, and incoming notifications will stop being sent to RingCentral App.

### Additional Note

There are several npm packages to be highlighted here:
- [sequelize](https://www.npmjs.com/package//sequelize): Node.js database ORM tool
- [axios](https://www.npmjs.com/package/axios): Promise based HTTP client for the browser and node.js
- [client-oauth2](https://www.npmjs.com/package/client-oauth2): OAuth2 wrapper
- [serverless](https://www.npmjs.com/package/serverless): serverless framework

When start development, it's recommended to use 3rd party's official npm package for its API calls.

# Deployment

## Register App on RingCentral Developer Website

Create your app following [this guide](https://developers.ringcentral.com/guide/applications).

## Deploy with Serverless

### 1. Compile JS files

```
$ npm run client-build
```

And get all JS assets file at public folder. Upload all files in public into CDN or static web server.

### 2. Create `serverless-deploy/env.yml` file

```
$ cp serverless-deploy/env.default.yml serverless-deploy/env.yml
```

Edit `serverless-deploy/env.yml` to set environment variables.
We will get `APP_SERVER` after first deploy. So now just keep it blank.

### 3. Create `serverless-deploy/serverless.yml` file

```
$ cp serverless-deploy/serverless.default.yml serverless-deploy/serverless.yml
```

Edit `serverless-deploy/env.yml` to update serverless settings.
The Dynamo `TableName` should be `${DYNAMODB_TABLE_PREFIX}webhooks`. `DYNAMODB_TABLE_PREFIX` is environment variable that we set upper. `ASSETS_PATH` is uri where you host JS files in `Step 1`.

### 4. Deploy

```
$ npm run serverless-build
$ npm run serverless-deploy
```

In first deploy, you will get lambda uri in console output: `https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod`.
Copy the uri, and update environment variable `APP_SERVER` with it in `serverless-deploy/env.yml` file. Then deploy again:

```
$ npm run serverless-deploy
```