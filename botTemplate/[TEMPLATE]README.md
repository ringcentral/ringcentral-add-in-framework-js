# RingCentral-Add-In-Framework

This template aims to help you quickly set up your app with 3rd party webhook integration.

# Prerequisites

- Download and install RingCentral App and login: https://www.ringcentral.com/apps/rc-app
- Nodejs and npm
- Register an app on rd party platform

# Development

## Step.1 Start Web Tunnel

```bash
# install dependencies
npm i

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
RINGCENTRAL_CHATBOT_SERVER= # Copy `https://xxxx.ngrok.io` from last step

<% if (useInteractiveMessage) { %>
# RingCentral developer portal
RINGCENTRAL_SHARED_SECRET= # You'll need a RingCentral App first, and this can then be found on developer portal, under App Settings
<% } %>
```

## Step.3 Create A Bot Add-In App In Sandbox

Go to [RingCentral Developer Portal](https://developers.ringcentral.com/) and [create a bot](https://developers.ringcentral.com/guide/basics/create-app).
<% if (useInteractiveMessage) { %>
On app creation page, please:
- Tick on Interactive Messages and fill in Outbound Webhook URL with `https://xxxx.ngrok.io/interactive-messages`
- Copy Shared Secret and fill in for `IM_SHARED_SECRET` in above `.env` file<% } %>

## Step.4 Write Your Code and Try It

Now that development environment is all set, let's write handler codes. We just need to focus on files under `src/handlers`. 

- `botHandler.js`: handles bot commands
- `cardHandlers.js`: handles Adaptive Card submissions

## Step.5 Start Local Server and Client

Open 2 new terminals and run below commands respectively:

```bash
# open a new terminal
# start local server
npm run dev
```

## Step.6 Quick Try

There are 3 bot commands in template. Try it with directly messaging bot with `command` or type @bot `command` in a team conversation:

1. `hello`: bot will response with `hello` as well
2. `card`: bot will response with an Adaptive Card
3. `dialog` (need support for `interactive messages`): bot will response with an Adaptive Card with buttons to open `Modal Dialog`.

### Additional Note

- [Adaptive Cards Designer](https://adaptivecards.io/designer/) is a great online tool to design your Adaptive Cards. Json files under `src/server/adaptiveCards` follow the same format as in `CARD PAYLOAD EDITOR`, so you can design your card on [Adaptive Cards Designer](https://adaptivecards.io/designer/) and copy over the payload directly.

# Test

This template uses [supertest](https://www.npmjs.com/package/supertest) and [nock](https://www.npmjs.com/package/nock) for testing. A few examples are in `tests` folder. To start test:

```bash
npm run test
```

<% if (deployment === 'aws_lambda_and_dynamoDB') { %>
# Deployment

## Deploy with Serverless

Deploy your bot with following steps:

1. Edit `serverless-deploy/env.yml` file (We will get `RINGCENTRAL_CHATBOT_SERVER` after first deploy. So now just keep it blank.)
2. Edit `serverless-deploy/serverless.yml` file
3. Deploy with `npm run serverless-build`, then `npm run serverless-deploy`

In first deployment, you will get lambda uri in console output: `https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod`.
Copy the uri, and update environment variable `RINGCENTRAL_CHATBOT_SERVER` with it in `serverless-deploy/env.yml` file. Then deploy again with `npm run serverless-deploy`
<%}%> 
<% if (deployment === 'heroku_with_postgres') { %>
# Deployment

## Deploy with Heroku

Deploy your bot with following steps:

1. Deploy with Heroku button 
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
2. Fill in params and create
   1. IM_SHARED_SECRET (from Developer Portal -> App Settings)
   2. RINGCENTRAL_CHATBOT_CLIENT_ID
   3. RINGCENTRAL_CHATBOT_CLIENT_SECRET
3. Go to Setting and Config Vars
   1. Copy DATABASE_URL value and paste to RINGCENTRAL_CHATBOT_DATABASE_CONNECTION_URI
   2. Copy domain (find it in Domains, https://your-service-name.herokuapp.com) and paste to RINGCENTRAL_CHATBOT_SERVER
4. Go to Developer Portal -> App Settings
   1. Change OAuth Redirect URI to {RINGCENTRAL_CHATBOT_SERVER}/bot/oauth
   2. If Interactive Messages enabled, change Outbound Webhook URL to {RINGCENTRAL_CHATBOT_SERVER}/interactive-messages
5. Go to Bot tab and `Add to RingCentral`

### Run And Test
1. Go to https://app.devtest.ringcentral.com
2. Search for your bot. It should show `welcome` upon conversation open.
3. type command `hello`. It should reply `hello`.
4. type command `card`. It should send a card with a name on it.
5. submit a new name with the card. It should update the card.
6. type command `card` again. It should show the new name tha is just given.

### More Info

- [Heroku Button](https://devcenter.heroku.com/articles/heroku-button)
- This template is configured with [Heroku Postgres](https://devcenter.heroku.com/articles/heroku-postgresql)
- Integrate with [Other Heroku Add-on](https://devcenter.heroku.com/categories/add-ons)
<%}%>