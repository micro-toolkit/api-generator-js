var Logger = require('../../logger'),
    log = Logger.getLogger('API::Handler::Get'),
    handleErrors = require('./error');
    factory = require('./factory');

function removeResource(metadata, config) {
  return factory.create(metadata, config, function(req, res, next) {
    log.info('Request delete resource with: %j', req.params);
    req.micro.client.remove(req.params, req.micro.headers)
      .then(function(data){
        log.debug('Resource removed successfully with: %j', data.payload);
        if (data.status === 204) {
          // no content
          res.sendStatus(204);
        } else {
          var model = req.micro.toModel(data.payload);
          res.status(data.status).json(model);
        }

        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  });
}

module.exports = removeResource;
