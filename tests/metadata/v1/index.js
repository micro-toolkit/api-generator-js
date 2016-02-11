var fs = require('fs'),
    path = require('path');

/**
* This is a clever convenience for accessing our custom metadata.
* In your app, you can just do something like:
*
*     var metadata = require('./metadata/index');
*     var modelMetadata = metadata.model;
*
* Inspired by the way Express/Connect loads middleware.
*/
fs.readdirSync(__dirname).forEach(function(filename) {
  if (filename === 'index.js') { return; }
  var modelName = path.basename(filename, '.json');
  function load(){ return require('./' + modelName); }
  exports.__defineGetter__(modelName, load);
});
