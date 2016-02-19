var _ = require('lodash'),
    metadataLoader = require('../../lib/metadata');

var version = 'v1';
function load(){
  var metadataIndex = require('./' + version + '/index');
  metadataIndex = _.reduce(metadataIndex, function(memo, value, key){
    memo[key] = metadataLoader(version, key, value);
    return memo;
  }, {});
  return metadataIndex;
}
exports.__defineGetter__(version, load);
