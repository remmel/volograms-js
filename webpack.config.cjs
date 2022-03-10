const path = require('path')

module.exports = {
  mode: 'production',
  entry: {
    'demo': './src/demo.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'build/bundle.[name].js',
  },
  performance: {
    maxEntrypointSize: 1024000,
    maxAssetSize: 1024000,
  },
  devServer: {
    static: './dist',
    compress: true,
    https: true,
    port: 9000,
    hot: true,
    host: '0.0.0.0',
    // disableHostCheck: true,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
    ]
  },
  // externals: { three: 'THREE'}
}
