var Logger = require('../../logger'),
    log = Logger.getLogger('micro.api.handler.nonstandardaction'),
    handleErrors = require('./error'),
    factory = require('./factory'),
    _ = require('lodash');

function nonStandardAction(metadata, config, action) {
  return factory.create(metadata, config, function(req, res, next) {
    log.trace('Request non standard action: %s', action.verb);
    // only properties specified on action allow are passed to the service
    var validProperties = _.pick(req.body, action.allow);
    var payload = _.merge({}, req.params, validProperties);

    req.micro.client.call(action.verb, payload, req.micro.headers)
      .then(function(data){
        log.trace('action executed successfully with: %j', data);
        if (data.status === 204) {
          // no content
          res.sendStatus(204);
          return next();
        }

        var result = _.isArray(data.payload) ?
          data.payload.map(req.micro.toModel)
          : req.micro.toModel(data.payload);
        var status = data.status || 200;
        res.status(status).json(result);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  });
}

module.exports = nonStandardAction;
