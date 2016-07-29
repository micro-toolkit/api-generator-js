var Logger = require('../../logger'),
    log = Logger.getLogger('micro.api.handler.resourcerelationcount'),
    handleErrors = require('./error'),
    factory = require('./factory');

function resourceRelationHandlerCount(relation, config) {
  log.trace(relation, 'Loading resource relation count handler');
  var metadataIndex = config.metadata[relation.version];
  var metadata = metadataIndex[relation.model];
  var currentUserKey = metadataIndex[relation.parent].currentUserKey;

  return factory.create(metadata, config, function(req, res, next) {
    log.info('Request relation count %s from %s with id %s',
      relation.name, relation.parent, req.params.id);

    // if current user key is set needs to go in the payload
    if (currentUserKey && req.user[currentUserKey]) {
      req.micro.payload[currentUserKey] = req.user[currentUserKey];
    }

    req.micro.payload[relation.modelFk] = req.params.id;

    req.micro.client.count(req.micro.payload, req.micro.headers)
      .then(function(data){
        log.debug('resource relation count received: %j', data.payload);
        res.json({ count: data.payload });
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  });
}

module.exports = resourceRelationHandlerCount;
