require('babel-register')({
  presets: [ 'env' ]
});
require("babel-polyfill");

// Import the rest of our application.
module.exports = require('./main.js');