const path = require('path');
const webpack = require('webpack');

const getBaseConfig = require('./getWebpackBaseConfig');
const buildPath = path.resolve(__dirname, 'src', 'assets');
const outputPath = path.resolve(__dirname, 'public');

const config = getBaseConfig();
config.devServer = {
  contentBase: buildPath,
  hot: true,
  inline: true,
  port: 8081,
};
config.output = {
  path: outputPath,
  filename: '[name].js',
};
config.plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoEmitOnErrorsPlugin(),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('development'),
    },
  }),
];
config.devtool = 'eval-source-map';
config.mode = 'development';

module.exports = config;
