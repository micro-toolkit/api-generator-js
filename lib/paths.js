var util = require('util'),
    _ = require('lodash'),
    inflection = require('lodash-inflection');

_.mixin(inflection);

function getCollectionPath(metadata, metadataIndex) {
  var path = _.pluralize(metadata.modelName).toLowerCase();

  // if model overrides path
  if (metadata.path.value) { path = metadata.path.value; }

  if (metadata.parent) {
    var resourcePath = getResourcePath(metadataIndex[metadata.parent],
      metadataIndex, true);
    return util.format('%s/%s',resourcePath, path);
  }

  if (metadata.path.prefix) {
    path = metadata.path.prefix + path;
  }

  return util.format('/%s/%s', metadata.version, path);
}

function getResourcePath(metadata, metadataIndex, parent) {
  var collectionPath = getCollectionPath(metadata, metadataIndex);

  if(parent) {
    var parentId = metadata.modelName + 'Id';
    return util.format('%s/:%s', collectionPath, parentId);
  }

  // authenticated endpoint without id
  if (metadata.currentUserKey) {
    return collectionPath;
  }

  return util.format('%s/:id', collectionPath);
}

function getResourceRelationPath(relation, metadataIndex) {
  if (relation.type === 'resource') {
    return getResourcePath(metadataIndex[relation.model]);
  }

  var sourceMetadata = metadataIndex[relation.parent];
  var path = getResourcePath(sourceMetadata);
  return util.format('%s/%s', path, relation.name.toLowerCase());
}

function nonStandardActionPath(metadata, action, metadataIndex) {
  var path = action.resource ? getResourcePath(metadata, metadataIndex)
    : getCollectionPath(metadata, metadataIndex);
  return util.format('%s/%s', path, action.name.toLowerCase());
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
    nonStandardAction:  function (metadata, action) {
      var metadataIndex = config.metadata[metadata.version];
      return nonStandardActionPath(metadata, action, metadataIndex);
    }
  };
}

module.exports = load;
