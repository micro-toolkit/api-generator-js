var model = require('../model'),
    Logger = require('../../logger'),
    log = Logger.getLogger('API::Handler'),
    clientFactory = require('../client'),
    _ = require('lodash'),
    enforceNumber = require('./enforce_number'),
    collectionDefaults = require('./collection_defaults');

var PAGINATION_PARAMS = ['limit', 'offset'];

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

function createHandler(metadata, config, handler) {
  var handlerConfig = getHandlerConfig(metadata, config);
  return function(req, res, next){
    log.trace('Request with params: %j and query: %j', req.params, req.query);
    var pagination = enforceNumber(
      _.pick(req.query, PAGINATION_PARAMS),
      'limit', 'offset'
    );
    var excludeQs = config.runtimeConfig.excludeQueryString;
    var qs = _.omit(req.query, excludeQs, 'fields', PAGINATION_PARAMS);

    req.micro = {
      query: qs,
      pagination: pagination,
      client: handlerConfig.client,
      toModel: handlerConfig.toModel
    };
    req.micro.payload = _.defaults({}, req.params, req.micro.query,
      req.micro.pagination, collectionDefaults);
    req.micro.headers = getHeaders(req, config.runtimeConfig.claims);
    log.debug('Request micro info: %j', req.micro);
    return handler(req, res, next);
  };
}

module.exports = {
  create: createHandler
};
