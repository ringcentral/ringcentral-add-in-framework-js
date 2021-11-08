# Demo

This demo is a simple and ready-to-use add-in notification app which sends Gitlab new issue event to Jupiter and users can choose to close the issue within Jupiter.

# Prerequisite

- Create an app on [RingCentral Developer Portal](https://developers.ringcentral.com/) ([Guide](https://developers.ringcentral.com/guide/basics/create-app))
- Create an app on [Gitlab](https://gitlab.com/-/profile/applications)

# Quick Start

## Step.1 Setup Environment

```bash
npm i
```

```bash
npm run ngrok
```

We'll get a `https://xxxxxx.ngrok.io` link. In your RingCentral app settings, fill:
- `Outbound Webhook URL` with `https://xxxxxx.ngrok.io/interactive-messages`
- Link in `This app can be installed via the web` with `https://xxxxxx.ngrok.io/setup`

And copy `Shared Secret` for use below.

Open another terminal and:

```bash
# initialize local database
npm run initDB
```

In `.env` file, let's fill it with:

```bash
# local dev server port, start local dev server by `npm run start`
PORT=6066
APP_HOST=localhost
APP_SERVER=https://xxxxxxxxxxxx.ngrok.io  # replace with the link we get above
APP_SERVER_SECRET_KEY=sampleKey

# 3rd party Oauth
CLIENT_ID=  # gitlab app client id
CLIENT_SECRET= # gitlab app client secret
ACCESS_TOKEN_URI=https://gitlab.com/oauth/token
AUTHORIZATION_URI=https://gitlab.com/oauth/authorize
SCOPES=api
SCOPES_SEPARATOR=,

# db uri
DATABASE_URL=sqlite://./db.sqlite
# client-side UI asset path
ASSETS_PATH=http://localhost:8081

# RingCentral developer portal
IM_SHARED_SECRET= # RingCentral App shared secret

API_SERVER=https://gitlab.com # gitlab server address

TEST_PROJECT_NAME=  # the project that you want to test for new issue notifications
```

## Step.2 Run Local Services

We now have an existing terminal that runs ngrok. Let's open two new terminals:

- run `npm run start`
- run `npm run client`

## Step.3 Install To Jupiter

Go to RingCentral Developer Portal -> Your App -> Credentials, at the bottom, `Install to team`. Then go to Jupiter sandbox `https://app.devtest.ringcentral.com`, you should be able to see your app under chat's app tab and Gitlab notifications for new issue will be sent to the channel.