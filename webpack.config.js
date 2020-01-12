const path = require('path')

module.exports = {
  entry: './app/client/js/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'app/client/dist')
  },
  mode: 'development'
}
