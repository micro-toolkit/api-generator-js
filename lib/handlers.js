var model = require('./model'),
    Logger = require('../logger'),
    log = Logger.getLogger('API::Handler'),
    clientFactory = require('./client'),
    errorHelper = require('./error_helper'),
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

function handleErrors(runtimeConfig, res, next) {
  return function (err) {
    log.error('collection data error: ', err);
    var error = errorHelper.getError(runtimeConfig, err);
    res.status(err.code).json(error);
    return next();
  };
}

function getHandlerConfig(metadata, config, serializeModel){
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = serializeModel ? model(config, metadata) : null;
  var claimsConfig = getClaimsConfig(config.runtimeConfig);
  return {
    client:   client,
    toModel:  toModel,
    claimsConfig:   claimsConfig
  };
}

function collectionHandler(metadata, config) {
  var handlerConfig = getHandlerConfig(metadata, config, true);
  var excludeQs = config.runtimeConfig.excludeQueryString || 'token';

  return function(req, res, next){
    log.info('Request collection with: %j', req.params);
    var qs = _.omit(req.query, excludeQs.split(','));
    var payload = _.defaults({}, req.params, qs, collectionDefaults);
    var headers = getClaims(req, handlerConfig.claimsConfig);
    handlerConfig.client.list(payload, headers)
      .then(function(data){
        log.debug('collection data received: %j', data);
        var models = data.map(handlerConfig.toModel);
        res.json(models);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function getResource(metadata, config) {
  var handlerConfig = getHandlerConfig(metadata, config, true);

  return function(req, res, next){
    log.info('Request resource %j', req.params);
    var headers = getClaims(req, handlerConfig.claimsConfig);
    handlerConfig.client.get(req.params, headers)
      .then(function(data){
        log.debug('resource data received: %j', data);
        var model = handlerConfig.toModel(data);
        res.json(model);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function createResource(metadata, config) {
  var handlerConfig = getHandlerConfig(metadata, config, true);

  return function(req, res, next){
    log.info('Request create resource with: %j', req.params);
    // only whitelisted properties are passed to the service
    var validProperties = _.pick(req.body, metadata.properties);
    var payload = _.defaults({}, req.params, validProperties);
    var headers = getClaims(req, handlerConfig.claimsConfig);
    handlerConfig.client.create(payload, headers)
      .then(function(data){
        log.debug('resource created successfully with: %j', data);
        var model = handlerConfig.toModel(data);
        res.json(model);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function updateResource(metadata, config) {
  var handlerConfig = getHandlerConfig(metadata, config, true);

  return function(req, res, next){
    log.info('Request update resource with: %j', req.params);

    // only whitelisted properties are passed to the service
    var validProperties = _.pick(req.body, metadata.properties);
    // overwrite payload id and other url ids
    var payload = _.defaults({}, req.params, validProperties);
    var headers = getClaims(req, handlerConfig.claimsConfig);

    handlerConfig.client.update(payload, headers)
      .then(function(data){
        log.debug('resource updated successfully with: %j', data);
        var model = handlerConfig.toModel(data);
        res.json(model);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function removeResource(metadata, config) {
  var handlerConfig = getHandlerConfig(metadata, config, false);

  return function(req, res, next){
    log.info('Request delete resource with: %j', req.params);
    var headers = getClaims(req, handlerConfig.claimsConfig);
    handlerConfig.client.remove(req.params, headers)
      .then(function(){
        log.debug('resource removed successfully');
        res.json();
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function resourceRelationHandler(relation, config) {
  var metadataIndex = config.metadata[relation.version];
  var client = clientFactory.init(relation.model, config.runtimeConfig);
  var toModel = model(config, metadataIndex[relation.model]);
  var claimsConfig = getClaimsConfig(config.runtimeConfig);
  var excludeQs = config.runtimeConfig.excludeQueryString || 'token';

  return function(req, res, next) {
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
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function nonStandardAction(metadata, config, action) {
  var serializeModel = ['put', 'post'].indexOf(action.httpVerb) !== -1;
  var handlerConfig = getHandlerConfig(metadata, config, serializeModel);

  return function(req, res, next){
    log.info('Request non standard action: %s', action.verb);
    var payload = { id: req.params.id };
    var headers = getClaims(req, handlerConfig.claimsConfig);
    handlerConfig.client.call(action.verb, payload, headers)
      .then(function(data){
        log.debug('action executed successfully with: %j', data);
        if (handlerConfig.toModel) {
          var model = handlerConfig.toModel(data);
          res.json(model);
          return next();
        }

        res.json();
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
    nonStandardAction: function(metadata, action) {
      return nonStandardAction(metadata, config, action);
    }
  };
}

module.exports = load;
