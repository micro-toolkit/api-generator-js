var Logger = require('../../logger'),
    log = Logger.getLogger('micro.api.handler.resourcerelation'),
    handleErrors = require('./error'),
    factory = require('./factory');

function resourceRelationHandler(relation, config) {
  var metadataIndex = config.metadata[relation.version];
  var metadata = metadataIndex[relation.model];
  return factory.create(metadata, config, function(req, res, next) {
    log.info('Request relation %s from %s with id %s',
      relation.name, relation.parent, req.params.id);

    var currentUserKey = metadataIndex[relation.parent].currentUserKey;
    // if current user key is set needs to go in the payload
    if (currentUserKey && req.user[currentUserKey]) {
      req.micro.payload[currentUserKey] = req.user[currentUserKey];
    }

    req.micro.payload[relation.modelFk] = req.params.id;
    req.micro.client.list(req.micro.payload, req.micro.headers)
      .then(function(data){
        log.debug('resource relation data received: %j', data.payload);
        var models = data.payload.map(req.micro.toModel);
        res.json(models);
        return next();
      })
      .fail(handleErrors(config.runtimeConfig, res, next));
  }, true);
}

module.exports = resourceRelationHandler;
