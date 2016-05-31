var model = require('./model'),
    Logger = require('../logger'),
    log = Logger.getLogger('API::Handler'),
    clientFactory = require('./client'),
    _ = require('lodash'),
    handleErrors = require('./handlers/error');
    enforceNumber = require('./handlers/enforce_number'),
    collectionDefaults = require('./handlers/collection_defaults');

function getClaimsConfig(runtimeConfig) {
  var claimsConfig = runtimeConfig.claims || '';
  return claimsConfig.split(',');
}

function getHeaders(req, claimsConfig) {
  var headers = _.pick(req.user, claimsConfig);
  headers['X-REQUEST-ID'] = req.requestId;
  return headers;
}

function getHandlerConfig(metadata, config){
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = model(config, metadata);
  var claimsConfig = getClaimsConfig(config.runtimeConfig);
  return {
    client:   client,
    toModel:  toModel,
    claimsConfig:   claimsConfig
  };
}

function collectionHandler(metadata, config) {
  var handlerConfig = getHandlerConfig(metadata, config);

  return function(req, res, next){
    log.info('Request collection with: %j', req.params);
    var qs = _.omit(req.query, config.runtimeConfig.excludeQueryString);
    enforceNumber(qs, 'limit', 'offset');
    var payload = _.defaults({}, req.params, qs, collectionDefaults);
    var headers = getHeaders(req, handlerConfig.claimsConfig);
    handlerConfig.client.list(payload, headers)
      .then(function(data){
        log.debug('collection data received: %j', data.payload);
        var models = data.payload.map(handlerConfig.toModel);
        res.json(models);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function getResource(metadata, config) {
  var handlerConfig = getHandlerConfig(metadata, config);

  return function(req, res, next){
    log.info('Request resource %j', req.params);
    var headers = getHeaders(req, handlerConfig.claimsConfig);
    var payload = req.params;

    // if current user key is set needs to go in the payload
    if (metadata.currentUserKey && req.user[metadata.currentUserKey]) {
      payload.id = req.user[metadata.currentUserKey];
    }

    handlerConfig.client.get(payload, headers)
      .then(function(data){
        log.debug('resource data received: %j', data.payload);
        var model = handlerConfig.toModel(data.payload);
        res.json(model);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function createResource(metadata, config) {
  var handlerConfig = getHandlerConfig(metadata, config);

  return function(req, res, next){
    log.info('Request create resource with: %j', req.params);
    // only whitelisted properties are passed to the service
    var validProperties = _.pick(req.body, metadata.properties);
    var payload = _.defaults({}, req.params, validProperties);
    var headers = getHeaders(req, handlerConfig.claimsConfig);
    handlerConfig.client.create(payload, headers)
      .then(function(data){
        log.debug('resource created successfully with: %j', data.payload);
        var model = handlerConfig.toModel(data.payload);
        res.json(model);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function updateResource(metadata, config) {
  var handlerConfig = getHandlerConfig(metadata, config);

  return function(req, res, next){
    log.info('Request update resource with: %j', req.params);

    // only whitelisted properties are passed to the service
    var validProperties = _.pick(req.body, metadata.properties);
    // overwrite payload id and other url ids
    var payload = _.defaults({}, req.params, validProperties);
    var headers = getHeaders(req, handlerConfig.claimsConfig);

    handlerConfig.client.update(payload, headers)
      .then(function(data){
        log.debug('resource updated successfully with: %j', data.payload);
        var model = handlerConfig.toModel(data.payload);
        res.json(model);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function removeResource(metadata, config) {
  var handlerConfig = getHandlerConfig(metadata, config);

  return function(req, res, next){
    log.info('Request delete resource with: %j', req.params);
    var headers = getHeaders(req, handlerConfig.claimsConfig);
    handlerConfig.client.remove(req.params, headers)
      .then(function(data){
        log.debug('resource removed successfully with: %j', data.payload);
        if (data.status === 204) {
          // no content
          res.sendStatus(204);
        } else {
          var model = handlerConfig.toModel(data.payload);
          res.status(data.status).json(model);
        }

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

  return function(req, res, next) {
    log.info('Request relation %s from %s with id %s',
      relation.name, relation.parent, req.params.id);

    var qs = _.omit(req.query, config.runtimeConfig.excludeQueryString);
    enforceNumber(qs, 'limit', 'offset');
    var payload = _.defaults({}, qs, collectionDefaults);

    var currentUserKey = metadataIndex[relation.parent].currentUserKey;
    // if current user key is set needs to go in the payload
    if (currentUserKey && req.user[currentUserKey]) {
      payload[currentUserKey] = req.user[currentUserKey];
    }

    payload[relation.modelFk] = req.params.id;

    var headers = getHeaders(req, claimsConfig);
    client.list(payload, headers)
      .then(function(data){
        log.debug('resource relation data received: %j', data.payload);
        var models = data.payload.map(toModel);
        res.json(models);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function resourceRelationHandlerCount(relation, config) {
  var metadataIndex = config.metadata[relation.version];
  var client = clientFactory.init(relation.model, config.runtimeConfig);
  var claimsConfig = getClaimsConfig(config.runtimeConfig);

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

    var headers = getHeaders(req, claimsConfig);
    client.count(payload, headers)
      .then(function(data){
        log.debug('resource relation data received: %j', data.payload);
        res.json({ count: data.payload });
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  };
}

function nonStandardAction(metadata, config, action) {
  var handlerConfig = getHandlerConfig(metadata, config);

  return function(req, res, next){
    log.info('Request non standard action: %s', action.verb);
    var headers = getHeaders(req, handlerConfig.claimsConfig);

    // only properties specified on action allow are passed to the service
    var validProperties = _.pick(req.body, action.allow);
    var payload = _.merge({}, req.params, validProperties);

    handlerConfig.client.call(action.verb, payload, headers)
      .then(function(data){
        log.debug('action executed successfully with: %j', data);
        if (data.status === 204) {
          // no content
          res.sendStatus(204);
          return next();
        }

        var result = _.isArray(data.payload) ?
          data.payload.map(handlerConfig.toModel)
          : handlerConfig.toModel(data.payload);
        var status = data.status || 200;
        res.status(status).json(result);
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
