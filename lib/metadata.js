var _ = require('lodash'),
    inflection = require('lodash-inflection');

_.mixin(inflection);

function load(modelName, metadata){
  // set model name
  metadata.modelName = modelName;

  // set empty actions list on model
  metadata.actions = metadata.actions || [];

  // set empty relations list on model
  metadata.relations = metadata.relations || [];

  // set relations model when not overwritten
  metadata.relations = metadata.relations.map(function(relation){
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
