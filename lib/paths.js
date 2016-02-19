var util = require('util'),
    _ = require('lodash'),
    inflection = require('lodash-inflection');

_.mixin(inflection);

function getCollectionPath(metadata) {
  return util.format('/%s/%s', metadata.version,
    _.pluralize(metadata.modelName));
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

function nonStandardActionPath(metadata, action) {
  return util.format('%s/%s',
    getResourcePath(metadata), action.name.toLowerCase());
}

function load(config){
  return {
    collection: getCollectionPath,
    resource: getResourcePath,
    resourceRelation: function(relation){
      var metadata = config.metadata[relation.version];
      return getResourceRelationPath(relation, metadata);
    },
    nonStandardAction: nonStandardActionPath,
  };
}

module.exports = load;
