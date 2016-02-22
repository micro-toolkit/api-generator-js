var util = require('util'),
    _ = require('lodash'),
    inflection = require('lodash-inflection');

_.mixin(inflection);

function getCollectionPath(metadata, metadataIndex) {
  var path = _.pluralize(metadata.modelName);
  if (metadata.parent) {
    var resourcePath = getResourcePath(metadataIndex[metadata.parent],
      metadataIndex, true);
    return util.format('%s/%s',resourcePath, path);
  }

  return util.format('/%s/%s', metadata.version, path);
}

function getResourcePath(metadata, metadataIndex, parent) {
  var collectionPath = getCollectionPath(metadata, metadataIndex);

  if(parent) {
    var parentId = metadata.modelName + 'Id';
    return util.format('%s/:%s', collectionPath, parentId);
  }

  return util.format('%s/:id', collectionPath);
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
    collection: function(metadata){
      var metadataIndex = config.metadata[metadata.version];
      return getCollectionPath(metadata, metadataIndex);
    },
    resource: function(metadata){
      var metadataIndex = config.metadata[metadata.version];
      return getResourcePath(metadata, metadataIndex);
    },
    resourceRelation: function(relation){
      var metadataIndex = config.metadata[relation.version];
      return getResourceRelationPath(relation, metadataIndex);
    },
    nonStandardAction: nonStandardActionPath,
  };
}

module.exports = load;
