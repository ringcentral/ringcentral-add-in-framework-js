const path = require('path');<% if (useOAuth) { %>
const authorizationRoute = require('./routes/authorization');<% } %>
const subscriptionRoute = require('./routes/subscription');
const notificationRoute = require('./routes/notification');
const viewRoute = require('./routes/view');
const constants = require('./lib/constants');

// extends or override express app as you need
exports.appExtend = (app) => {
  app.set('views', path.resolve(__dirname, './views'));
  app.set('view engine', 'pug');

  // setup client
  app.get(constants.route.forClient.CLIENT_SETUP, viewRoute.setup);
  <% if (useOAuth) { %>// authorization
  app.get(constants.route.forClient.OPEN_AUTH_PAGE, authorizationRoute.openAuthPage);
  app.get(constants.route.forThirdParty.AUTH_CALLBACK, authorizationRoute.oauthCallback);
  app.get(constants.route.forClient.GET_USER_INFO, authorizationRoute.getUserInfo);
  app.post(constants.route.forClient.GENERATE_TOKEN, authorizationRoute.generateToken);
  // revoke
  app.post(constants.route.forClient.REVOKE_TOKEN, authorizationRoute.revokeToken);<% } %>
  // configure
  app.post(constants.route.forClient.SUBSCRIBE, subscriptionRoute.subscribe);
  // notification
  app.post(constants.route.forThirdParty.NOTIFICATION, notificationRoute.notification);
  app.post(constants.route.forThirdParty.INTERACTIVE_MESSAGE, notificationRoute.interactiveMessages);
}
