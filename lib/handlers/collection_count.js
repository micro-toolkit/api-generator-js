var Logger = require('../../logger'),
    log = Logger.getLogger('micro.api.handler.collectioncount'),
    handleErrors = require('./error'),
    factory = require('./factory'),
    _ = require('lodash');

function collectionCountHandler(metadata, config) {
  return factory.create(metadata, config, function(req, res, next) {
    log.trace('Request collection count');
    var payload = _.omit(req.micro.payload, ['limit', 'offset']);
    req.micro.client.count(payload, req.micro.headers)
      .then(function(data){
        log.trace('collection count data received: %j', data.payload);
        res.json({ count: data.payload });
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  }, true);
}

module.exports = collectionCountHandler;
