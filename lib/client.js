var ZSSClient = require('zmq-service-suite-client'),
    _ = require('lodash'),
    Logger = require('../logger'),
    log = Logger.getLogger('API::MicroClient'),
    util = require('util');


function getConfig(runtimeConfig, modelName){
  var defaultConfig = runtimeConfig.defaultService;
  var conf = runtimeConfig[modelName + 'Service'];
  if (conf) { return _.defaults({}, conf, defaultConfig); }

  var msg = util.format(
    'Model %s doesn\'t have a service config with key: %sService',
    modelName, modelName);
  log.error(msg);
  throw new Error(msg);
}

function payloadResolver(data){
  return data.payload;
}

function init(modelName, runtimeConfig){
  var client = new ZSSClient(getConfig(runtimeConfig, modelName));

  return {
    get: function(id){
      return client.call('get', { id: id })
        .then(payloadResolver);
    },
    list: function(payload, headers){
      log.trace('Call \'list\' with headers %j & payload %j', payload, headers);
      return client.call('list', payload || {}, { headers: headers })
        .then(payloadResolver);
    },
    create: function(payload, headers){
      log.trace('Call \'create\' with headers %j & payload %j',
        payload, headers);
      return client.call('create', payload || {}, { headers: headers })
        .then(payloadResolver);
    },
    update: function(payload, headers){
      log.trace('Call \'update\' with headers %j & payload %j',
        payload, headers);
      return client.call('update', payload || {}, { headers: headers })
        .then(payloadResolver);
    },
    remove: function(id, headers){
      log.trace('Call \'remove\' with headers %j & payload %j',
        payload, headers);
      return client.call('remove', { id: id }, { headers: headers })
        .then(payloadResolver);
    },
    call: client.call
  };
}

module.exports = {
  init: init
};
