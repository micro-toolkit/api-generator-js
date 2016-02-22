var express = require('express'),
    _ = require('lodash'),
    routes = require('./lib/routes'),
    metadataLoader = require('./lib/metadata'),
    Logger = require('./logger'),
    log = Logger.getLogger('API::METADATA');

function loadingRoutes(router, modelData, config){
  routes(config, modelData).map(function(route){
    log.info('Mount route %s \t%s', route.verb.toUpperCase(), route.path);

    if (route.middleware) {
      router[route.verb](route.path, route.middleware, route.handler);
    } else {
      router[route.verb](route.path, route.handler);
    }
  });

  return router;
}

function loadModel(version, versionMetadata){
  return _.reduce(versionMetadata, function(memo, metadata, modelName){
    var modelData = metadataLoader(version, modelName, metadata);
    log.info('Model \'%s\': %j', modelName, modelData);
    memo[modelName] = modelData;
    return memo;
 }, {});
}

function loadVersion(memo, versionMetadata, version) {
  memo[version] = loadModel(version, versionMetadata);
  return memo;
}

function apiRouter(config){
  var router = express.Router();

  // load models
  log.info('Loading API Models...');
  config.metadata = _.reduce(config.metadata, loadVersion, {});
  log.info('Loaded API Models...');

  // loading routes
  log.info('Loading API routes...');
  Object.keys(config.metadata).forEach(function(version){
    var versionMetadata = config.metadata[version];
    Object.keys(versionMetadata).forEach(function(modelName){
      var metadata = versionMetadata[modelName];
      router = loadingRoutes(router, metadata, config);
    });
  });
  log.info('Loaded API routes...');

  return router;
}


module.exports = apiRouter;
