var _ = require('lodash');

var bodyParser = require('body-parser').json();

var getError = require('../error_helper').getError;

var BAD_REQUEST = 400;

var BAD_REQUEST_ERR = {
  developerMessage: 'The JSON message sent is invalid',
  userMessage: 'Something went wrong. Please review your data.',
  code: BAD_REQUEST
};

function translateError(err) {
  var isInvalidJSONErr = err instanceof SyntaxError &&
    _.get(err, 'status') === BAD_REQUEST;

  if (isInvalidJSONErr) {
    return getError({}, BAD_REQUEST_ERR);
  }
  return err;
}

module.exports = function (req, res, next) {
  bodyParser(req, res, function (err) {
    if (err) {
      var apiError = translateError(err);
      return res.status(BAD_REQUEST).json(apiError);
    }

    next();
  });
};
