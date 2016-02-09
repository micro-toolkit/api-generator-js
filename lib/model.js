var _ = require('lodash'),
    pathsLoader = require('./paths');

function absoluteUrl(runtimeConfig, path, id) {
  var url = runtimeConfig.baseUrl + path;
  // TODO: improve maybe with regex
  return url.replace(':id', id);
}

function getLinks(metadata, properties, paths, runtimeConfig){
  var links = {
    self: absoluteUrl(runtimeConfig, paths.resource(metadata), properties.id)
  };

  return _.inject(metadata.relations, function(memo, relation){
    var isResourceType = relation.type === 'resource';
    var id = (isResourceType) ? properties[relation.modelFk] : properties.id;
    var path = paths.resourceRelation(relation);
    memo[relation.name] = absoluteUrl(runtimeConfig, path, id);
    return memo;
  }, links);
}

function createModel(config, metadata){
  var paths = pathsLoader(config);
  var whitelist = metadata.properties;

  return function(attrs){
    var defaults = _.reduce(whitelist, function(memo, prop) {
      memo[prop] = null;
      return memo;
    }, {});

    var obj = {};

    // filter whitelisted properties
    var props = _.pick(attrs, whitelist);

    // set defaults on this
    _.defaults(obj, props, defaults);

    obj._links = getLinks(metadata, obj, paths, config.runtimeConfig);

    return obj;
  };
}

module.exports = createModel;
