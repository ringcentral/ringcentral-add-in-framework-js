# RingCentral Add In Framework

The framework will help you create a [RingCentral Add-In App](https://developers.ringcentral.com/guide/team-messaging/add-ins) that subscribes to 3rd party notifications via webhook and forward incoming notifications from 3rd party server to RingCentral App.

# Prerequisites

- Download and install RingCentral App and login: https://www.ringcentral.com/apps/rc-app
- Nodejs and npm.

# Install Framework

This framework contains several templates due to the fact that different 3rd party platforms have different designs on their APIs. Before starting the installation, please:
1. Go to 3rd party platform and register a new app there. For most platforms who have OAuth flow implementation, there will be `ClientId` and `ClientSecret` generated for your app.
2. If 3rd party platform uses `OAuth`, please check if it uses `accessToken` + `refreshToken` OR just `accessToken`.
3. If 3rd party platform uses `OAuth`, please find their API endpoints for authorization and access token exchange.

Then install the template with following commands:

```bash
npx ringcentral-add-in-framework template
```

We also have simple demos that are based on the template and they'll be up and running with a few steps to configure. Demos can be installed with:

```bash
npx ringcentral-add-in-framework demo
```

For further Information, please refer to the `README.md` that's inside your generated template or demo.
