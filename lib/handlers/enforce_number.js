var _ = require('lodash');

function enforceNumber() {
  var obj = _.first(arguments);
  if (_.isEmpty(obj)) {
    return obj;
  }
  var keys = Array.prototype.slice.call(arguments, 1);
  _.each(keys, function (key) {
    if (obj[key]) {
      obj[key] = parseInt(obj[key]);
      if (_.isNaN(obj[key])) {
        delete obj[key];
      }
    }
  });
  return obj;
}

module.exports = enforceNumber;
