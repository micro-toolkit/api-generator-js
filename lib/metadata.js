var _ = require('lodash'),
    inflection = require('lodash-inflection'),
    Logger = require('../logger'),
    log = Logger.getLogger('API::Metadata::Loader');

_.mixin(inflection);

function load(version, modelName, metadata){
  log.trace('version \'%s\' model \'%s\' metadata %j',
    version, modelName, metadata);

  // set model version
  metadata.version = version;

  // set model name
  metadata.modelName = modelName;

  // set empty actions list on model
  metadata.actions = metadata.actions || [];

  // set empty relations list on model
  metadata.relations = metadata.relations || [];

  // set relations model when not overwritten
  metadata.relations = metadata.relations.map(function(relation){
    relation.version = metadata.version;
    relation.model = relation.model || _.singularize(relation.name);
    relation.parent = metadata.modelName;
    var isCollection = relation.type === 'collection';
    var fk = isCollection ? relation.parent + 'Id' : relation.model + 'Id';
    relation.modelFk = relation.modelFk || fk;
    return relation;
  });

  return metadata;
}

module.exports = load;
