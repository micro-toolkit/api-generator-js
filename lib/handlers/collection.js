var Logger = require('../../logger'),
    log = Logger.getLogger('API::Handler::Collection'),
    handleErrors = require('./error'),
    factory = require('./factory');

function collectionHandler(metadata, config) {
  return factory.create(metadata, config, function(req, res, next) {
    log.info('Request collection with: %j and %j', req.params, req.query);
    req.micro.client.list(req.micro.payload, req.micro.headers)
      .then(function(data){
        log.debug('collection data received: %j', data.payload);
        var models = data.payload.map(req.micro.toModel);
        res.json(models);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  }, true);
}

module.exports = collectionHandler;
