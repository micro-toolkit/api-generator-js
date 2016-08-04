var _ = require('lodash'),
    pathsLoader = require('./paths');

function absoluteUrl(runtimeConfig, path, id, properties) {
  var url = runtimeConfig.baseUrl + path;
  url = url.replace(':id', id);
  return _.reduce(properties, function(memo, value, key){
    return memo.replace(':' + key, value);
  }, url);
}

function getLinks(metadata, properties, paths, runtimeConfig){
  var selfPath = paths.resource(metadata);
  var includeId = _.includes(metadata.properties, metadata.idKey);
  var hasGetAction = _.includes(metadata.actions, 'get');
  var createSelfLink = includeId && hasGetAction;

  var self = createSelfLink ?
    absoluteUrl(runtimeConfig, selfPath, properties.id, properties) : null;
  var links = { self: self };

  return _.reduce(metadata.relations, function(memo, relation){
    var isResourceType = relation.type === 'resource';
    var id = (isResourceType) ?
      properties[relation.modelFk] :
      properties[metadata.idKey];
    var path = paths.resourceRelation(relation);

    // inject model id property prefix with modelName for parent links
    properties = _.clone(properties);
    properties[metadata.modelName + 'Id'] = properties.id;

    memo[relation.name] = absoluteUrl(runtimeConfig, path, id, properties);
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
