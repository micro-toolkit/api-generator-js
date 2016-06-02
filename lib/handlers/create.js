var Logger = require('../../logger'),
    log = Logger.getLogger('API::Handler::Create'),
    handleErrors = require('./error'),
    factory = require('./factory'),
    _ = require('lodash');

function createResource(metadata, config) {
  return factory.create(metadata, config, function(req, res, next){
    log.info('Request create resource with: %j and %j', req.params, req.body);
    // only whitelisted properties are passed to the service
    var validProperties = _.pick(req.body, metadata.properties);
    var payload = _.defaults({}, req.params, validProperties);
    req.micro.client.create(payload, req.micro.headers)
      .then(function(data){
        log.debug('resource created successfully with: %j', data.payload);
        var model = req.micro.toModel(data.payload);
        res.json(model);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  });
}

module.exports = createResource;
