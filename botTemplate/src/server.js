const { createApp } = require('glip-integration-js');

const appConf = require('./index.js');

exports.server = createApp(appConf);
