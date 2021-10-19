const path = require('path');
const subscriptionRoute = require('./routes/subscription');
const taskRoute = require('./routes/task');
const viewRoute = require('./routes/view');
const constants = require('./lib/constants');

// extends or override express app as you need
exports.appExtend = (app) => {
  app.set('views', path.resolve(__dirname, './views'));
  app.set('view engine', 'pug');

  // setup client
  app.get(constants.route.forClient.CLIENT_SETUP, viewRoute.setup);

  // configure
  app.post(constants.route.forClient.SUBSCRIBE, subscriptionRoute.subscribe);
  // task
  app.post(constants.route.forThirdParty.TASK, taskRoute.newTask);
  app.post(
    constants.route.forThirdParty.INTERACTIVE_MESSAGES,
    taskRoute.interactiveMessages
  );
};
