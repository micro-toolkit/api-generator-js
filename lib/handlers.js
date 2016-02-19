var model = require('./model'),
    Logger = require('../logger'),
    log = Logger.getLogger('API::Handler'),
    clientFactory = require('./client'),
    _ = require('lodash');

var collectionDefaults = {
  limit:  10,
  offset: 0,
};

function getClaimsConfig(runtimeConfig) {
  var claimsConfig = runtimeConfig.claims || '';
  return claimsConfig.split(',');
}

function getClaims(req, claimsConfig) {
  return _.pick(req.user, claimsConfig);
}

function collectionHandler(metadata, config) {
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = model(config, metadata);
  var claimsConfig = getClaimsConfig(config.runtimeConfig);
  var excludeQs = config.runtimeConfig.excludeQueryString || 'token';

  return function(req, res){
    log.info('Request collection');
    var qs = _.omit(req.query, excludeQs.split(','));
    var payload = _.defaults({}, qs, collectionDefaults);
    var headers = getClaims(req, claimsConfig);
    client.list(payload, headers)
      .then(function(data){
        log.debug('collection data received: %j', data);
        var models = data.map(toModel);
        res.json(models);
      })
      .fail(function(err){
        log.error('collection data error: ', err.stack || err);
        res.status(err.code).json(err);
      });
  };
}

function getResource(metadata, config) {
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = model(config, metadata);
  var claimsConfig = getClaimsConfig(config.runtimeConfig);

  return function(req, res){
    log.info('Request resource', req.params.id);
    var headers = getClaims(req, claimsConfig);
    client.get(req.params.id, headers)
      .then(function(data){
        log.debug('resource data received: %j', data);
        var model = toModel(data);
        res.json(model);
      })
      .fail(function(err){
        log.error('resource data error: ', err.stack || err);
        res.status(err.code).json(err);
      });
  };
}

function createResource(metadata, config) {
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = model(config, metadata);
  var claimsConfig = getClaimsConfig(config.runtimeConfig);

  return function(req, res){
    log.info('Request create resource');
    // only whitelisted properties are passed to the service
    var payload = _.pick(req.body, metadata.properties);
    var headers = getClaims(req, claimsConfig);
    client.create(payload, headers)
      .then(function(data){
        log.debug('resource created successfully with: %j', data);
        var model = toModel(data);
        res.json(model);
      })
      .fail(function(err){
        log.error('resource create error: ', err.stack || err);
        res.status(err.code).json(err);
      });
  };
}

function updateResource(metadata, config) {
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = model(config, metadata);
  var claimsConfig = getClaimsConfig(config.runtimeConfig);

  return function(req, res){
    log.info('Request update resource');

    // only whitelisted properties are passed to the service
    var payload = _.pick(req.body, metadata.properties);
    // overwrite payload id
    payload.id = req.params.id;
    var headers = getClaims(req, claimsConfig);

    client.update(payload, headers)
      .then(function(data){
        log.debug('resource updated successfully with: %j', data);
        var model = toModel(data);
        res.json(model);
      })
      .fail(function(err){
        log.error('resource update error: ', err.stack || err);
        res.status(err.code).json(err);
      });
  };
}

function removeResource(metadata, config) {
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var claimsConfig = getClaimsConfig(config.runtimeConfig);

  return function(req, res){
    log.info('Request delete resource', req.params.id);
    var headers = getClaims(req, claimsConfig);
    client.remove(req.params.id, headers)
      .then(function(){
        log.debug('resource removed successfully');
        res.json();
      })
      .fail(function(err){
        log.error('resource remove error: ', err.stack || err);
        res.status(err.code).json(err);
      });
  };
}

function resourceRelationHandler(relation, config) {
  var metadataIndex = config.metadata[relation.version];
  var client = clientFactory.init(relation.model, config.runtimeConfig);
  var toModel = model(config, metadataIndex[relation.model]);
  var claimsConfig = getClaimsConfig(config.runtimeConfig);
  var excludeQs = config.runtimeConfig.excludeQueryString || 'token';

  return function(req, res){
    log.info('Request relation %s from %s with id %s',
      relation.name, relation.parent, req.params.id);

    var qs = _.omit(req.query, excludeQs.split(','));
    var payload = _.defaults({}, qs, collectionDefaults);
    payload[relation.modelFk] = req.params.id;
    var headers = getClaims(req, claimsConfig);
    client.list(payload, headers)
      .then(function(data){
        log.debug('resource relation data received: %j', data);
        var models = data.map(toModel);
        res.json(models);
      })
      .fail(function(err){
        log.error('resource relation retrieved with error: ', err.stack || err);
        res.status(err.code).json(err);
      });
  };
}

function nonStandardAction(metadata, config, action) {
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var serializeModel = ['put', 'post'].indexOf(action.httpVerb) !== -1;
  var toModel = (serializeModel) ? model(config, metadata) : null;
  var claimsConfig = getClaimsConfig(config.runtimeConfig);

  return function(req, res){
    log.info('Request non standard action: %s', action.verb);
    var payload = { id: req.params.id };
    var headers = getClaims(req, claimsConfig);
    client.call(action.verb, payload, headers)
      .then(function(data){
        log.debug('action executed successfully with: %j', data);
        if (toModel) {
          var model = toModel(data);
          return res.json(model);
        }

        res.json();
      })
      .fail(function(err){
        log.error('action executed with error: ', err.stack || err);
        res.status(err.code).json(err);
      });
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
    nonStandardAction: function(metadata, action) {
      return nonStandardAction(metadata, config, action);
    }
  };
}

module.exports = load;
