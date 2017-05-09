var Logger = require('../../logger'),
    log = Logger.getLogger('micro.api.handler.nonstandardaction'),
    handleErrors = require('./error'),
    factory = require('./factory'),
    embed = require('../embed'),
    _ = require('lodash');

function nonStandardAction(metadata, config, action) {
  return factory.create(metadata, config, function(req, res, next) {
    log.trace('Request non standard action: %s', action.verb);
    // only properties specified on action allow are passed to the service
    var validProperties = _.pick(req.body, action.allow);
    var payload = _.merge({}, req.params, validProperties);

    req.micro.client.call(action.verb, payload, req.micro.headers)
      .then(function(response){
        log.trace('action executed successfully with: %j', response);
        if (response.status === 204) {
          // no content
          res.sendStatus(204);
          return next();
        }

        var data = response.payload;
        var status = response.status || 200;

        return embed(metadata, config, req.query, data)
          .then(function(data){
            var isArray = _.isArray(data);
            var result = isArray ? data.map(req.micro.toModel)
              : req.micro.toModel(data);
            res.status(status).json(result);
            return next();
          });
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  });
}

module.exports = nonStandardAction;
