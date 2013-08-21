var ekitjs = require('ekitjs');
var path = require('path');

// set config file
ekitjs.set('root_path', __dirname);
ekitjs.set('config.json', path.join(__dirname, 'config.json'));

// start server
ekitjs.start();