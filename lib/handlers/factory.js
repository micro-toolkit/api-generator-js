var model = require('../model'),
    Logger = require('../../logger'),
    log = Logger.getLogger('micro.api.handler'),
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
  log.trace(metadata, 'get handler configuration');
  var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
  var toModel = model(config, metadata);
  return {
    client: client,
    toModel: toModel
  };
}

function createHandler(metadata, config, handler, pagination) {
  var includePagination = pagination || false;
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
      toModel: handlerConfig.toModel,
      payload: _.defaults({}, req.params, qs),
      headers: getHeaders(req, config.runtimeConfig.claims)
    };

    if (includePagination){
      req.micro.payload = _.defaults(req.micro.payload,
        req.micro.pagination, collectionDefaults);
    }

    log.trace('Request micro info: %j', req.micro);
    return handler(req, res, next);
  };
}

module.exports = {
  create: createHandler
};
