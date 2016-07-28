var Logger = require('../../logger'),
    log = Logger.getLogger('micro.api.handler.update'),
    handleErrors = require('./error'),
    factory = require('./factory'),
    _ = require('lodash');

function updateResource(metadata, config) {
  return factory.create(metadata, config, function(req, res, next) {
    log.info('Request update resource with: %j and %j', req.params, req.body);
    // only whitelisted properties are passed to the service
    var validProperties = _.pick(req.body, metadata.properties);
    // overwrite payload id and other url ids
    var payload = _.defaults({}, req.params, validProperties);
    req.micro.client.update(payload, req.micro.headers)
      .then(function(data){
        log.debug('resource updated successfully with: %j', data.payload);
        var model = req.micro.toModel(data.payload);
        res.json(model);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  });
}

module.exports = updateResource;
