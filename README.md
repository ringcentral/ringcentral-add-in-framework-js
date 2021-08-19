# RingCentral-Add-In-Framework

The framework will help you create a RingCentral Add-In App that subscribes to 3rd party notifications via webhook and forward incoming notifications from 3rd party server to RingCentral App.

This project aims to help you quickly set up a local test environment so that you can move from there and integration 3rd party functionalities in.

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
  - Ubsubscribe and clear user info

# Run It

## Step.1 Start Web Tunnel

```bash
# get the code
git clone git@github.com:DaKingKong/ringcentral-add-in-framework.git
cd ringcentral-add-in-framework

# install dependecies
npm i

# start proxy server, this will allow your local bot server to be accessed by the RingCentral service
npm run ngrok

# will show
Forwarding                    https://xxxx.ngrok.io -> localhost:6066
# Remember the https://xxxx.us.ngrok.io, we will use it later
```

ngrok will expose your local server to a public address where you can have other services interact with it easily.

Note: your local firewall might block certain ngrok regions, change `ngrok http -region us 6066` in `package.json` to [other regions](https://www.google.com/search?q=ngrok+regions).

## Step.2 Set Up Environment Info

```bash
# create env file
cp .env.sample .env

# create db file
npm run initDB
```

Copy above https://xxxx.us.ngrok.io over to APP_SERVER field in `.env` file.


```bash
# open a new terminal
# start local server
npm run start

# open another new terminal
# start client app
npm run client
```

## Step.3 Mock Subscription

Since we haven't register our app on RingCentral Developer website. We'll need to use [RingCentral notification app developer tool](https://ringcentral.github.io/ringcentral-notification-app-developer-tool/) to simulate RingCentral App Gallery shell.

![developer-tool](./diagram/developer-tool.png)

There are two fields we want to fill in:

1. `App Url`: It wants the app entry point here. Simply add `/view` to the end of `https://xxxx.us.ngrok.io`.
2. `Webhook Url`: Go to RingCentral App Gallery and add Incoming Webhook App to your conversation channel. As a result, you will get a webhook URL like `https://hooks.glip.com/webhook/xxxxx` (aka `RC_WEBHOOK`) and that's what we need here.

Now press `Apply` ([workflow 1-2](#workflow-diagram)). We should be able to see the UI button gets rendered in top block.

There's no actual 3rd party integration, so we'll do following mock steps instead.

- `Mock Auth` ([workflow 3-7](#workflow-diagram)): Press `Connect to 3rd Party Service and Subcscribe`. It will open a mock auth page and immediately close it, which is considered as a successful auth.
- `Mock Subscription` ([workflow 8-11](#workflow-diagram)): Upon the close of auth page, a mock subscription automatically happens (in practice, it's recommended to create a separate flow for it). `SERVER_WEBHOOK` is our message receiving endpoint url, it will be sent to 3rd party so that we can receive notifications from 3rd party service.

## Step.4 Send Mock Messages

Now it is all set. Let's try sending some messages to our RingCentral App conversation channel.

- `Mock Message` ([workflow 12-15](#workflow-diagram)): We are playing the role of a 3rd party service here to send mock message to `SERVER_WEBHOOK`. Do a HTTP POST to `https://xxxx.us.ngrok.io/notification` with below payload format:
  
```json
{
    "isAdaptiveCard": false,   // false for RingCentral Card with plain message, true for Adapative Card
    "id":"sub-123456",   // do NOT change this, it's a hard-coded mock subcription id in subscription.js
    "username": "test user",
    "userEmail": "test@test.com",
    "documentName": "test.docx"
}
```

## Step.5 Revoke

Press `Ubsubcribe and Logout`, and incoming notifications will not be sent to your RingCentral App conversation channel.

# Workflow Diagram

![flow](./diagram/flow.svg)

# Considerations on Integration and Development

`!!!IMPORTANT!!! This framework is composed by mock actions which simulate responses from a 3rd party API server. All places with ===[Replace]=== tag should be replaced with the actual logic that handles interactions with 3rd party service`

## Webhook Subscription

Webhook subcriptions could be quite different among different service providers, some questions should be considered:
- Is there a filtering mechanism to subscribe to selected types of events? If so, we'll want to add UIs for configuring it.
- Does subscription messages contain all the information we want? If not, we'll want to have follow-up logic to fetch it. An example would be, Google Drive activity only has resourceId, and we want to use it to then fetch full file info with resourceId.

## Message Transform

Message tranform happens when we receive notifications and parse them into either [RingCentral Card](https://developers.ringcentral.com/guide/team-messaging/manual/posting-cards) or [Adaptive Card](https://adaptivecards.io/designer/).

## Example Project

Check out branch `Example` under this project.

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