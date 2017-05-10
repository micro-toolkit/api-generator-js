var _ = require('lodash');

function getHeaders(req, claimsConfig) {
  var headers = _.pick(req.user, claimsConfig);
  headers['X-REQUEST-ID'] = req.requestId;
  return headers;
}

module.exports = getHeaders;
