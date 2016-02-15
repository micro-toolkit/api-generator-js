var express = require('express'),
    routes = require('./lib/routes'),
    metadataLoader = require('./lib/metadata'),
    Logger = require('./logger'),
    log = Logger.getLogger('API::METADATA');

function loadModel(router, modelData, config){
  log.info('Model: %j', modelData);
  routes(config, modelData).map(function(route){
    log.info('Mount route %s %s', route.verb.toUpperCase(), route.path);

    if (route.middleware) {
      router[route.verb](route.path, route.middleware, route.handler);
    } else {
      router[route.verb](route.path, route.handler);
    }
  });

  return router;
}

function apiRouter(config){
  log.info('Loading API Models...');
  var router = express.Router();
  Object.keys(config.metadata).forEach(function(version){
    var versionMetadata = config.metadata[version];
    Object.keys(versionMetadata).forEach(function(modelName){
      var metadata = versionMetadata[modelName];
      var modelData = metadataLoader(version, modelName, metadata);
      router = loadModel(router, modelData, config);
    });
  });

  return router;
}


module.exports = apiRouter;
