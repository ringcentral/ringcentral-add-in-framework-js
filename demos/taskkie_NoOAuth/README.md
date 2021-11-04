# RingCentral-Add-In-Framework Tasskie  Demo

This demo implements a self-hosted service that creates simple tasks from outside RingCentral App and manages them within RingCentral App conversations.

# Prerequisites

- Download and install RingCentral App and login: https://www.ringcentral.com/apps/rc-app
- Nodejs and npm.

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

```bash
# .env file

# local server setup
# Copy `https://xxxx.ngrok.io` from last step
APP_SERVER= 

# RingCentral developer portal
# You'll need a RingCentral App first, and this can then be found on developer portal, under App Settings
IM_SHARED_SECRET= 
```

## Step.3 Test

```bash
# open a new terminal
# start local server
npm run start
```

### Online Developer Tool

For local development, we can use [RingCentral notification app developer tool](https://ringcentral.github.io/ringcentral-notification-app-developer-tool/) to simulate RingCentral App Gallery shell which handles communications between your app and RingCentral server.

To use above tool, there are two fields we want to fill in:

1. `App Url`: It is for this tool to retrieve the app's entry point to render. In our framework, it's set to `https://xxxx.ngrok.io/setup`
2. `Webhook Url`, there are 2 ways:
   1. Click `Get a webhookUrl` and login to your RingCentral App. Generate webhook url from your Team channel.
   2. Go to RingCentral App Gallery and add `Incoming Webhook` App to your conversation channel. As a result, you will get a webhook URL like `https://hooks.glip.com/webhook/xxxxx` (aka `RC_WEBHOOK`) and that's what we need here.

Now press `Apply` ([workflow 1-2](#workflow-diagram)). We should be able to see the UI button gets rendered in top block.

(Important note: [RingCentral notification app developer tool](https://ringcentral.github.io/ringcentral-notification-app-developer-tool/) doesn't provide the environment for `interactiveMessages`([workflow 8-22](#workflow-diagram)). To have a test environment for that, you will need to [create your sandbox app](#register-app-on-ringcentral-developer-website) on [RingCentral Developer Portal](https://developers.ringcentral.com/login.html#/) (Add-In is currently in beta, so you want to join beta on the same web page).)

### POST Test Data

There is a simple HTTP POST script: `scripts/test-data.js`. If you need to have a quick test to mock 3rd party notification, please follow comments inside the file.

```bash
# run test post data
node scripts/test-data.js
```

# Test

This template uses [supertest](https://www.npmjs.com/package/supertest) and [nock](https://www.npmjs.com/package/nock) for testing. A few examples are in `tests` folder. To start test:

```bash
npm run test
```

# Deployment

## Register App on RingCentral Developer Website

Create your app following [this guide](https://developers.ringcentral.com/guide/applications).

## Deploy with Serverless

### 1. Create `serverless-deploy/env.yml` file

```
$ cp serverless-deploy/env.default.yml serverless-deploy/env.yml
```

Edit `serverless-deploy/env.yml` to set environment variables.
We will get `APP_SERVER` after first deploy. So now just keep it blank.

### 2. Create `serverless-deploy/serverless.yml` file

```
$ cp serverless-deploy/serverless.default.yml serverless-deploy/serverless.yml
```

Edit `serverless-deploy/env.yml` to update serverless settings.
The Dynamo `TableName` should be `${DYNAMODB_TABLE_PREFIX}webhooks`. `DYNAMODB_TABLE_PREFIX` is environment variable that we set upper.

### 3. Deploy

```
$ npm run serverless-build
$ npm run serverless-deploy
```

In first deploy, you will get lambda uri in console output: `https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod`.
Copy the uri, and update environment variable `APP_SERVER` with it in `serverless-deploy/env.yml` file. Then deploy again:

```
$ npm run serverless-deploy
```