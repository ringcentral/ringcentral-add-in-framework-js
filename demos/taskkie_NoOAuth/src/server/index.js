const path = require('path');
const cors = require('cors');
const subscriptionRoute = require('./routes/subscription');
const notificationRoute = require('./routes/notification');
const viewRoute = require('./routes/view');
const constants = require('./lib/constants');

// extends or override express app as you need
exports.appExtend = (app) => {
  app.use(cors());
  app.set('views', path.resolve(__dirname, './views'));
  app.set('view engine', 'pug');

  // setup client
  app.get(constants.route.forClient.CLIENT_SETUP, viewRoute.setup);

  // configure
  app.post(constants.route.forClient.SUBSCRIBE, subscriptionRoute.subscribe);
  // task
  app.post(constants.route.forThirdParty.NOTIFICATION, notificationRoute.notification);
  app.post(constants.route.forThirdParty.INTERACTIVE_MESSAGES, notificationRoute.interactiveMessages);
};
