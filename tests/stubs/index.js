var fs = require('fs'),
    path = require('path');

/**
* This is a clever convenience for accessing our service stubs.
* In your app, you can just do something like:
*
*     var stubs = require('./tests/stubs');
*     stubs.model
*
* Inspired by the way Express/Connect loads middleware.
*/
fs.readdirSync(__dirname).forEach(function(filename) {
  if (filename === 'index.js') { return; }
  var modelName = path.basename(filename, '.json');
  function load(){
    return require('./' + modelName);
  }
  exports.__defineGetter__(modelName, load);
});
