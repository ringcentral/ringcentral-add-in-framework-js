const { createApp } = require('glip-integration-js');

const appConf = require('./server/index.js');

exports.server = createApp(appConf);
