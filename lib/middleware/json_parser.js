var bodyParser = require('body-parser').json();

var getError = require('../error_helper').getError;

var BAD_REQUEST = 400;

var BAD_REQUEST_ERR = {
  developerMessage: 'The JSON message sent is invalid',
  userMessage: 'Something went wrong. Please review your data.',
  code: BAD_REQUEST
};

module.exports = function (req, res, next) {
  bodyParser(req, res, function (err) {
    if (err) {
      var apiError = getError({}, BAD_REQUEST_ERR);
      return res.status(BAD_REQUEST).json(apiError);
    }

    next();
  });
};
