var fs = require('fs'),
    path = require('path'),
    metadata = require('../../lib/metadata');

/**
* This is a clever convenience for accessing our custom metadata.
* In your tests, you can just do something like:
*
*     var metadata = require('./metadata/index');
*     app.use(metadata.model);
*
* Inspired by the way Express/Connect loads middleware.
*/
fs.readdirSync(__dirname).forEach(function(filename) {
  if (filename === 'index.js') { return; }
  var modelName = path.basename(filename, '.json');
  function load(){
    var model = require('./' + modelName);
    return metadata(modelName, model);
  }
  exports.__defineGetter__(modelName, load);
});
