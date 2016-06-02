var model = require('./model'),
    Logger = require('../logger'),
    log = Logger.getLogger('API::Handler'),
    clientFactory = require('./client'),
    _ = require('lodash'),
    handleErrors = require('./handlers/error');
    enforceNumber = require('./handlers/enforce_number'),
    collectionDefaults = require('./handlers/collection_defaults'),
    collectionHandler = require('./handlers/collection'),
    getResource = require('./handlers/get'),
    createResource = require('./handlers/create'),
    updateResource = require('./handlers/update'),
    removeResource = require('./handlers/remove'),
    nonStandardAction = require('./handlers/non_standard_action'),
    resourceRelationHandler = require('./handlers/resource_relation');

function getHeaders(req, claimsConfig) {
  var headers = _.pick(req.user, claimsConfig);
  headers['X-REQUEST-ID'] = req.requestId;
  return headers;
}

function getHandlerConfig(metadata, config){
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = model(config, metadata);
  return {
    client: client,
    toModel: toModel
  };
}

function resourceRelationHandlerCount(relation, config) {
  var metadataIndex = config.metadata[relation.version];
  var client = clientFactory.init(relation.model, config.runtimeConfig);

  return function(req, res, next) {
    log.info('Request relation count %s from %s with id %s',
      relation.name, relation.parent, req.params.id);

    var payload = _.omit(req.query, config.runtimeConfig.excludeQueryString);

    var currentUserKey = metadataIndex[relation.parent].currentUserKey;
    // if current user key is set needs to go in the payload
    if (currentUserKey && req.user[currentUserKey]) {
      payload[currentUserKey] = req.user[currentUserKey];
    }

    payload[relation.modelFk] = req.params.id;

    var headers = getHeaders(req, config.runtimeConfig.claims);
    client.count(payload, headers)
      .then(function(data){
        log.debug('resource relation data received: %j', data.payload);
        res.json({ count: data.payload });
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function load(config){
  return {
    collection: function(metadata){
      return collectionHandler(metadata, config);
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
