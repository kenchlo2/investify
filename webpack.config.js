const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: './client/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js'
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.jsx?/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader"
          }
        ]
      }      
    ]
  },
  plugins: [
    new HtmlWebPackPlugin()
  ],
  devServer: {
    publicPath: '/build',
    proxy: {
      '/': 'http://localhost:3000',
      '/src/styles.css': 'http://localhost:3000/src/styles.css'
    }
  }
};