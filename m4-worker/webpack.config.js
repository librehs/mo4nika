const path = require('path')

module.exports = {
  mode: 'development',
  target: 'webworker',
  entry: {
    main: './src/worker.ts',
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    fallback: {
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      url: require.resolve('url/'),
      buffer: require.resolve('buffer/'),
      fs: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.mjs$/,
        type: 'javascript/auto',
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'worker.js',
  },
  performance: {
    hints: false,
  },
}
