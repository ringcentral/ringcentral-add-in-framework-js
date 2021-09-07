# RingCentral-Add-In-Framework

The framework will help you create a RingCentral Add-In App that subscribes to 3rd party notifications via webhook and forward incoming notifications from 3rd party server to RingCentral App.

# Prerequisites

- Download and install RingCentral App and login: https://www.ringcentral.com/apps/rc-app
- Nodejs and npm.

# Install Framework

This framework contains several templates and demos. 3rd party platforms have different designs on their APIs. Before starting the installation, please check whether the 3rd party platform uses `OAuth`. If so, also check if it uses `accessToken` + `refreshToken` OR just `accessToken`.

Please install with following commands:

```bash
npx ringcentral-add-in-framework template
```

The installation prompt will take you through several steps to set up the template.

For further Information, please refer to the `README.md` that's inside your generated template.

# TODOs
- No OAuth template
- Better UI components