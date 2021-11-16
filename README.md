# RingCentral Add-In Framework

The framework will help you create a [RingCentral Add-In App](https://developers.ringcentral.com/guide/team-messaging/add-ins) that subscribes to 3rd party notifications via webhook and forward incoming notifications from 3rd party server to RingCentral App.

# Prerequisites

- Download and install RingCentral App and login: https://www.ringcentral.com/apps/rc-app
- Nodejs and npm.

# Install Framework

This framework contains several templates due to the fact that different 3rd party platforms have different designs on their APIs. Before starting the installation, please:
1. Go to 3rd party platform and register a new app there. For most platforms who have OAuth flow implementation, there will be `ClientId` and `ClientSecret` generated for your app.
2. If 3rd party platform uses `OAuth`, please check if it uses `accessToken` + `refreshToken` OR just `accessToken`.
3. If 3rd party platform uses `OAuth`, please find their API endpoints for authorization and access token exchange.

Then install a `template` with following commands:

```bash
npx ringcentral-add-in-framework template
```

We also have simple `demos` that are based on the template and they'll be up and running with a few steps to configure. Demos can be installed with:

```bash
npx ringcentral-add-in-framework demo
```

# Use Framework Template

This framework should be used as a boilerplate project. To work with a plain `template`, we essentially want to fill in our business logic in handlers which are for:
- Authorization (authorize Add-In server with user's 3rd party platform account)
- Subscription (create event subscription on 3rd party platform)
- Notification (receive and format data from 3rd party platform when subscribed events happen)

## Coding

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

# Use Framework Demo

It's a lot easier than using a `template`, and `demos` are essentially `templates` with platform-dependent logic written to implement simple functionality. Therefore a few cli commands would make it up and run.

At the moment, we have `demos` for `Github`, `Asana` and `Gitlab`.

# Detailed Info

For further Information, please refer to the `README.md` that's inside your generated template or demo and [RingCentral App Developer Guide](https://developers.ringcentral.com/guide/applications)
