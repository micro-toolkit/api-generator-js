var model = require('./model'),
    Logger = require('../logger'),
    log = Logger.getLogger('API::Handler'),
    clientFactory = require('./client'),
    _ = require('lodash');

var collectionDefaults = {
  limit:  10,
  offset: 0,
};

function collectionHandler(metadata, config) {
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = model(config, metadata);

  return function(req, res){
    log.info('Request collection');
    var payload = _.defaults({}, req.query, collectionDefaults);
    client.all(payload)
      .then(function(data){
        log.debug('collection data received: %j', data);
        var models = data.map(toModel);
        res.json(models);
      })
      .fail(function(err){
        log.error('collection data error: ', err.stack || err);
        res.status(err.code).json(err.body);
      });
  };
}

function getResource(metadata, config) {
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = model(config, metadata);

  return function(req, res){
    log.info('Request resource', req.params.id);
    client.get(req.params.id)
      .then(function(data){
        log.debug('resource data received: %j', data);
        var model = toModel(data);
        res.json(model);
      })
      .fail(function(err){
        log.error('resource data error: ', err.stack || err);
        res.status(err.code).json(err.body);
      });
  };
}

function createResource(metadata, config) {
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = model(config, metadata);

  return function(req, res){
    log.info('Request create resource');
    // only whitelisted properties are passed to the service
    var payload = _.pick(req.body, metadata.properties);
    client.create(payload)
      .then(function(data){
        log.debug('resource created successfully with: %j', data);
        var model = toModel(data);
        res.json(model);
      })
      .fail(function(err){
        log.error('resource create error: ', err.stack || err);
        res.status(err.code).json(err.body);
      });
  };
}

function updateResource(metadata, config) {
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = model(config, metadata);

  return function(req, res){
    log.info('Request update resource');

    // only whitelisted properties are passed to the service
    var payload = _.pick(req.body, metadata.properties);
    // overwrite payload id
    payload.id = req.params.id;
    
    client.update(payload)
      .then(function(data){
        log.debug('resource updated successfully with: %j', data);
        var model = toModel(data);
        res.json(model);
      })
      .fail(function(err){
        log.error('resource update error: ', err.stack || err);
        res.status(err.code).json(err.body);
      });
  };
}

function removeResource(metadata, config) {
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);

  return function(req, res){
    log.info('Request delete resource', req.params.id);
    client.remove(req.params.id)
      .then(function(){
        log.debug('resource removed successfully');
        res.json();
      })
      .fail(function(err){
        log.error('resource remove error: ', err.stack || err);
        res.status(err.code).json(err.body);
      });
  };
}

function resourceRelationHandler(relation, config) {
  var metadataIndex = config.metadata[relation.version];
  var client = clientFactory.init(relation.model, config.runtimeConfig);
  var toModel = model(config, metadataIndex[relation.model]);

  return function(req, res){
    log.info('Request relation %s from %s with id %s',
      relation.name, relation.parent, req.params.id);

    var payload = _.defaults({}, req.query, collectionDefaults);
    payload[relation.modelFk] = req.params.id;
    client.all(payload)
      .then(function(data){
        log.debug('resource relation data received: %j', data);
        var models = data.map(toModel);
        res.json(models);
      })
      .fail(function(err){
        log.error('resource relation retrieved with error: ', err.stack || err);
        res.status(err.code).json(err.body);
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
    }
  };
}

module.exports = load;
