var util = require('util'),
    _ = require('lodash'),
    inflection = require('lodash-inflection');

_.mixin(inflection);

function getCollectionPath(metadata) {
  return util.format('/%s', _.pluralize(metadata.modelName));
}

function getResourcePath(metadata) {
  return util.format('%s/:id', getCollectionPath(metadata));
}

function getResourceRelationPath(relation, metadataIndex) {
  if (relation.type === 'resource') {
    return getResourcePath(metadataIndex[relation.model]);
  }

  var sourceMetadata = metadataIndex[relation.parent];
  var path = getResourcePath(sourceMetadata);
  return util.format('%s/%s', path, relation.name);
}

function load(config){
  return {
    collection: getCollectionPath,
    resource: getResourcePath,
    resourceRelation: function(relation){
      return getResourceRelationPath(relation, config.metadata);
    }
  };
}

module.exports = load;
