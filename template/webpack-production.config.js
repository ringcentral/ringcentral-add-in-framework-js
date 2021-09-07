const path = require('path');
const webpack = require('webpack');

const getBaseConfig = require('./getWebpackBaseConfig');
const outputPath = path.resolve(__dirname, 'public');

const config = getBaseConfig();
config.output = {
  path: outputPath,
  filename: '[name].js',
};
config.plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
    },
  }),
];
config.mode = 'production';

module.exports = config;
