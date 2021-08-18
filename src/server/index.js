const path = require('path');
const authorizationRoute = require('./routes/authorization');
const subcriptionRoute = require('./routes/subscription');
const notificationRoute = require('./routes/notification');
const viewRoute = require('./routes/view');
const constants = require('./lib/constants');

// extends or override express app as you need
exports.appExtend = (app) => {
  app.set('views', path.resolve(__dirname, './views'));
  app.set('view engine', 'pug');

  // setup client
  app.get(constants.route.forClient.CLIENT_VIEW, viewRoute.clientView);

  // authorization
  app.get(constants.route.forClient.OPEN_AUTH_PAGE, authorizationRoute.openAuthPage);
  app.get(constants.route.forThirdParty.AUTH_CALLBACK, authorizationRoute.oauthCallback);
  app.get(constants.route.forClient.GET_USER_INFO, authorizationRoute.getUserInfo);
  app.post(constants.route.forClient.SAVE_USER_INFO, authorizationRoute.saveUserInfo);

  // configure
  app.post(constants.route.forClient.SUBSCRIBE, subcriptionRoute.subscribe);
  
  // notification
  app.post(constants.route.forThirdParty.NOTIFICATION, notificationRoute.notification);

  // revoke
  app.post(constants.route.forClient.REVOKE_TOKEN, authorizationRoute.revokeToken);
}
