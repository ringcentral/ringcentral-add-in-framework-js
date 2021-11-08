# RingCentral-Add-In-Framework

This template aims to help you quickly set up your app with 3rd party webhook integration.
<% if (deployment === 'heroku_with_postgres') { %>
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
<%}%> 
# Prerequisites

- Download and install RingCentral App and login: https://www.ringcentral.com/apps/rc-app
- Nodejs and npm
- Register an app on rd party platform

# How It Works

There are 3 major parts involved:
- Setup:
  - Get RingCentral App info
  - Auth on 3rd party and subscribe to events
- Use:
  - Process and forward 3rd party event notifications to RingCentral App via webhook
- Revoke:
  - Unsubscribe and clear user info

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

# local server setup
APP_SERVER= # Copy `https://xxxx.ngrok.io` from last step

# 3rd party Oauth
CLIENT_ID= # client id for 3rd party platform app
CLIENT_SECRET= # client secret for 3rd party platform app
ACCESS_TOKEN_URI= # token uri for 3rd party platform
AUTHORIZATION_URI= # auth uri for 3rd party platform
SCOPES= # if SCOPES_SEPARATOR is ',', then SCOPES will be something like scope1,scope2,scope3
SCOPES_SEPARATOR=, # this field is default to ',', but can be changed

# RingCentral developer portal
IM_SHARED_SECRET= # You'll need a RingCentral App first, and this can then be found on developer portal, under App Settings
```

## Step.3 Create A Notification Add-In App In Sandbox

Go to [RingCentral Developer Portal](https://developers.ringcentral.com/) and [create a notification add-in app](https://developers.ringcentral.com/guide/basics/create-app).

On app creation page, please:
- Tick on Interactive Messages and fill in Outbound Webhook URL with `https://xxxx.ngrok.io/interactive-messages`
- Copy Shared Secret and fill in for `IM_SHARED_SECRET` in above `.env` file
- Tick on 'This app can be installed via web' and fill in `https://xxxx.ngrok.io/setup` 

## Step.4 Write Your Code and Try It

Now that development environment is all set, let's write handler codes. We just need to focus on files under `src/server/handlers`. 

Workflow-wise, let's write codes for files in following order:
1. authorizationHandler.js = authorization([workflow 3-7](#workflow-diagram)) + revoke([workflow 31-33](#workflow-diagram))
2. subscriptionHandler.js = subscription([workflow 8-11](#workflow-diagram))
3. notificationHandler.js = notification([workflow 12-15](#workflow-diagram)) + interactive message([workflow 16-30](#workflow-diagram))

### Workflow Diagram

Note: if you don't have Markdown view, please open the flow diagram directly from `diagram/flow.svg`.

![flow](./diagram/flow.svg)

### Data Transformation

[Adaptive Cards Designer](https://adaptivecards.io/designer/) is a great online tool to design your Adaptive Cards. Json files under `src/server/adaptiveCards` follow the same format as in `CARD PAYLOAD EDITOR`, so you can design your card on [Adaptive Cards Designer](https://adaptivecards.io/designer/) and copy over the payload directly.

## Step.5 Start Local Server and Client

Open 2 new terminals and run below commands respectively:

```bash
# open a new terminal
# start local server
npm run start

# open another new terminal
# start client app
npm run client
```

### POST Test Data

There is a simple HTTP POST script: `scripts/test-data.js`. If you need to have a quick test to mock 3rd party notification, please follow comments inside the file.

```bash
# run test post data
node scripts/test-data.js
```

### Tips

- `npm run refreshDB` to delete existing local db file and create a new one

### Additional Note

There are several npm packages to be highlighted here:
- [adaptivecards-templating](https://www.npmjs.com/package/adaptivecards-templating): Tool to inject data into Adaptive Cards json files.
- [sequelize](https://www.npmjs.com/package//sequelize): Node.js database ORM tool
- [axios](https://www.npmjs.com/package/axios): Promise based HTTP client for the browser and node.js
- [client-oauth2](https://www.npmjs.com/package/client-oauth2): OAuth2 wrapper
- [serverless](https://www.npmjs.com/package/serverless): serverless framework

When start development, it's recommended to use 3rd party's official npm package for its API calls.

# Test

This template uses [supertest](https://www.npmjs.com/package/supertest) and [nock](https://www.npmjs.com/package/nock) for testing. A few examples are in `tests` folder. To start test:

```bash
npm run test
```

<% if (deployment === 'aws_lambda_and_dynamoDB') { %>
# Deployment

## Deploy with Serverless

### 1. Compile JS files

```
$ npm run client-build
```

And get all JS assets file at public folder. Upload all files in public into CDN or static web server.

### 1.1. Host client with server static host

It's not recommended, but if you want to have a easier deployment without hosting client files on a separated place (eg. via CDN, [Github Pages](https://pages.github.com/) etc.), you could choose to add following code in `src/server/index.js`

```javascript
// static host client code
app.use('/client', express.static(__dirname + '/client'));
```

Move client built output in `public` to `src/server/client`, and then `ASSETS_PATH` in `.env` should be `{serverAddress}/client`.

It's essentially a tradeoff between simple hosting and client app download speed.

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
<%}%> 

<% if (deployment === 'heroku_with_postgres') { %>
# Deployment

## Deploy with Heroku

Use Heroku deploy button on the top to do initial deployment. Then link your repository with Heroku for future deployments using `git push heroku {branch}`.

More Info:

- [Heroku Button](https://devcenter.heroku.com/articles/heroku-button)
- This template is configured with [Heroku Postgres](https://devcenter.heroku.com/articles/heroku-postgresql)
- Integrate with [Other Heroku Add-on](https://devcenter.heroku.com/categories/add-ons)
<%}%> 