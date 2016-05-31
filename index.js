var express = require('express'),
    requestIdMiddleware = require('request-id/express')(),
    _ = require('lodash'),
    routes = require('./lib/routes'),
    metadataLoader = require('./lib/metadata'),
    partialResponseMiddleware = require('express-partial-response'),
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

function loadConfigs(config) {
  // TODO: Add unit/integration tests for this loadings and defaults 
  var conf = _.cloneDeep(config);
  var runtimeConf = config.runtimeConfig;
  var excludeQs = runtimeConf.excludeQueryString || 'token,access_token';
  runtimeConf.excludeQueryString = excludeQs.split(',');
  return conf;
}

function apiRouter(config){
  var router = express.Router();
  router.use(requestIdMiddleware);
  router.use(partialResponseMiddleware());

  // load configs
  var conf = loadConfigs(config);

  // load models
  log.info('Loading API Models...');
  config.metadata = _.reduce(conf.metadata, loadVersion, {});
  log.info('Loaded API Models...');

  // loading routes
  log.info('Loading API routes...');
  Object.keys(conf.metadata).forEach(function(version){
    var versionMetadata = conf.metadata[version];
    Object.keys(versionMetadata).forEach(function(modelName){
      var metadata = versionMetadata[modelName];
      router = loadingRoutes(router, metadata, conf);
    });
  });
  log.info('Loaded API routes...');

  return router;
}


module.exports = apiRouter;
