var collectionHandler = require('./handlers/collection'),
    collectionCountHandler = require('./handlers/collection_count'),
    getResource = require('./handlers/get'),
    createResource = require('./handlers/create'),
    updateResource = require('./handlers/update'),
    removeResource = require('./handlers/remove'),
    nonStandardAction = require('./handlers/non_standard_action'),
    resourceRelationHandler = require('./handlers/resource_relation'),
    resourceRelationHandlerCount = require('./handlers/resource_relation_count');

function load(config){
  return {
    collection: function(metadata){
      return collectionHandler(metadata, config);
    },
    collectionCount: function(metadata){
      return collectionCountHandler(metadata, config);
    },
    getResource: function(metadata){
      return getResource(metadata, config);
    },
    createResource: function(metadata){
      return createResource(metadata, config);
    },
    updateResource: function(metadata){
      return updateResource(metadata, config);
    },
    removeResource: function(metadata){
      return removeResource(metadata, config);
    },
    resourceRelation: function(relation){
      return resourceRelationHandler(relation, config);
    },
    resourceRelationCount: function(relation){
      return resourceRelationHandlerCount(relation, config);
    },
    nonStandardAction: function(metadata, action) {
      return nonStandardAction(metadata, config, action);
    }
  };
}

module.exports = load;
