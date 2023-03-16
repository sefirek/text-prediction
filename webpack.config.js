// const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  entry: './src/webWorker/worker.mjs',
  output: {
    filename: 'worker.bundle.js',
    path: process.cwd() + '/public',
  },
  mode: 'development',
  // plugins: [new NodePolyfillPlugin()],
};
