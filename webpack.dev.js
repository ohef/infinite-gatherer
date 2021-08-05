const path = require('path');
const commonSettings = require('./webpack.common');

module.exports = Object.assign(commonSettings, {
  mode: 'development',
  watch: true,
  devtool: 'source-map',
  devServer: {
    contentBase: path.join(__dirname, '/dist/'),
    inline: true,
    host: '127.0.0.1',
    disableHostCheck: true,
    port: 8080
  }
});