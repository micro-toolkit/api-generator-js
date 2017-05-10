var Logger = require('../../logger'),
    log = Logger.getLogger('micro.api.handler.collection'),
    handleErrors = require('./error'),
    factory = require('./factory'),
    embed = require('../embed'),
    _ = require('lodash');

function collectionHandler(metadata, config) {
  return factory.create(metadata, config, function(req, res, next) {
    log.trace('Request collection with: %j and %j', req.params, req.query);
    req.micro.client.list(req.micro.payload, req.micro.headers)
      .then(function(data){
        log.trace('collection data received: %j', data.payload);
        return data.payload;
      })
      .then(_.partial(embed, metadata, config, req))
      .then(function(models){
        res.json(models.map(req.micro.toModel));
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  }, true);
}

module.exports = collectionHandler;
