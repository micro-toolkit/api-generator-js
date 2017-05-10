var Logger = require('../../logger'),
    log = Logger.getLogger('micro.api.handler.get'),
    handleErrors = require('./error'),
    embed = require('../embed'),
    factory = require('./factory'),
    _ = require('lodash');

function getResource(metadata, config) {
  return factory.create(metadata, config, function(req, res, next){
    log.trace('Request get resource %j', req.params);

    // if current user key is set needs to go in the payload
    if (metadata.currentUserKey && req.user[metadata.currentUserKey]) {
      req.micro.payload.id = req.user[metadata.currentUserKey];
    }

    req.micro.client.get(req.micro.payload, req.micro.headers)
      .then(function(data){
        log.trace('Resource data received: %j', data.payload);
        return data.payload;
      })
      .then(_.partial(embed, metadata, config, req))
      .then(function(model){
        res.json(req.micro.toModel(model));
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  });
}

module.exports = getResource;
