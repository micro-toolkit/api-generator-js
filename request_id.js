var uuid = require('node-uuid').v4;

function defaults(options) {
  options = options || {};

  return {
    reqHeader: options.reqHeader || 'X-Request-Id',
    resHeader: options.resHeader || 'X-Request-Id',
    paramName: options.paramName || 'requestId',
    generator: options.generator || uuid
  };
}

module.exports = function requestId(options) {
  var opts = defaults(options);

  return function (req, res, next) {
    if(!req[opts.paramName]){
      req[opts.paramName] = req.get(opts.reqHeader) ||
        req.query[opts.paramName] || opts.generator();
      res.setHeader(opts.resHeader, req[opts.paramName]);
    }

    next();
  };
};
