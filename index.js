var express = require('express'),
    requestIdMiddleware = require('request-id/express')(),
    _ = require('lodash'),
    routes = require('./lib/routes'),
    metadataLoader = require('./lib/metadata'),
    partialResponseMiddleware = require('express-partial-response'),
    Logger = require('./logger'),
    log = Logger.getLogger('micro.api.metadata');

function loadingRoutes(router, modelData, config){
  routes(config, modelData).map(function(route){
    log.trace('Mount route %s \t%s', route.verb.toUpperCase(), route.path);

    // TODO: Include this in path module instead
    // this was the only quick solution to avoid route clashes between
    // resource get and collection count since the resource get uses wildcard
    // that match everything both routes would be executed
    // Related with https://github.com/micro-toolkit/api-generator-js/issues/103
    var path = (route.verb !== 'get') ? route.path
      : route.path.replace(new RegExp('/:id$'), '/:id(?!count)([\\-\\w]+)');
    if (route.middleware) {
      router[route.verb](path, route.middleware, route.handler);
    } else {
      router[route.verb](path, route.handler);
    }
  });

  return router;
}

function loadModel(version, versionMetadata){
  return _.reduce(versionMetadata, function(memo, metadata, modelName){
    var modelData = metadataLoader(version, modelName, metadata);
    log.trace('Model \'%s\': %j', modelName, modelData);
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
  var runtimeConf = conf.runtimeConfig;
  var excludeQs = runtimeConf.excludeQueryString || 'token,access_token';
  runtimeConf.excludeQueryString = excludeQs.split(',');
  runtimeConf.claims = (runtimeConf.claims || '').split(',');
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
  conf.metadata = _.reduce(conf.metadata, loadVersion, {});
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
