var Logger = require('../../logger'),
    errorHelper = require('../error_helper'),
    log = Logger.getLogger('micro.api.handler');

function handleErrors(runtimeConfig, res, next) {
  return function (err) {
    var error = errorHelper.getError(runtimeConfig, err);
    log.error('A error occurred while running handler %j', error);
    if(err.stack) { log.warn('The error have the following stack', err.stack); }
    res.status(err.code).json(error);
    return next();
  };
}

module.exports = handleErrors;
