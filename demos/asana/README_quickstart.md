# Demo

This demo is a simple and ready-to-use add-in notification app which sends Asana task name change event to Jupiter and users can choose to complete the task within Jupiter.

# Prerequisite

- Create an app on [RingCentral Developer Portal](https://developers.ringcentral.com/) ([Guide](https://developers.ringcentral.com/guide/basics/create-app))
- Create an app on [Asana](https://asana.com/developers)

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
CLIENT_ID=  # asana app client id
CLIENT_SECRET= # asana app client secret
ACCESS_TOKEN_URI=https://app.asana.com/-/oauth_token
AUTHORIZATION_URI=https://app.asana.com/-/oauth_authorize
SCOPES=default
SCOPES_SEPARATOR=,

# db uri
DATABASE_URL=sqlite://./db.sqlite
# client-side UI asset path
ASSETS_PATH=http://localhost:8081

# RingCentral developer portal
IM_SHARED_SECRET= # RingCentral App shared secret
```

## Step.2 A Small Adjustment

Asana webhook notification requires an unique return message with a `x-hook-secret` header. Please add the following code in `src/server/routes/notification.js` - `notification()` methods, before:

```javascript
res.status(200);
res.json({
    result: 'OK',
});
```

so we'll have:

```javascript
// required by Asana for handshake (https://developers.asana.com/docs/webhooks)
if (req.headers['x-hook-secret']) {
  res.header('X-Hook-Secret', req.headers['x-hook-secret']);
}

res.status(200);
res.json({
    result: 'OK',
});
```

## Step.3 Run Local Services

We now have an existing terminal that runs ngrok. Let's open two new terminals:

- run `npm run start`
- run `npm run client`

## Step.4 Install To Jupiter

Go to RingCentral Developer Portal -> Your App -> Credentials, at the bottom, `Install to team`. Then go to Jupiter sandbox `https://app.devtest.ringcentral.com`, you should be able to see your app under chat's app tab and Asana notifications for task name change will be sent to the channel.