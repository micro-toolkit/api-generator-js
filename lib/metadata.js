var util = require('util'),
    _ = require('lodash'),
    inflection = require('lodash-inflection'),
    Logger = require('../logger'),
    log = Logger.getLogger('API::Metadata::Loader');

_.mixin(inflection);

var standardActions = ['list', 'get', 'create', 'update', 'remove'];
var nonStandardActionAllowedHttpVerbs = ['put', 'delete', 'post'];

function isStandardAction(action){
  var isStringAction = typeof action === 'string';
  var isStandardAction = standardActions.indexOf(action) !== -1;
  return isStringAction && isStandardAction;
}

function isInvalidAction(action){
  // check if the action is a standard action
  if (isStandardAction(action)) { return null; }

  var httpVerb = (action.httpVerb || '').toLowerCase();
  var allowedVerb = nonStandardActionAllowedHttpVerbs.indexOf(httpVerb) !== -1;
  if (!allowedVerb){ return 'httpVerb'; }
  if (!action.name || action.name === ''){ return 'name'; }
  if (!action.verb || action.verb === ''){ return 'verb'; }

  return null;
}

function mapAction(action){
  var invalidProperty = isInvalidAction(action);
  if (invalidProperty) {
    throw new Error(util.format('The action %j is invalid due to %s',
      action, invalidProperty));
  }

  if (isStandardAction(action)){ return action; }

  return {
    name:     action.name.toLowerCase(),
    httpVerb: action.httpVerb.toLowerCase(),
    verb:     action.verb.toLowerCase()
  };
}

function load(version, modelName, metadata){
  log.trace('Loading Model: version \'%s\' model \'%s\' metadata %j',
    version, modelName, metadata);

  // set model version
  metadata.version = version;

  // set model parent
  metadata.parent = metadata.parent || null;

  // set model name
  metadata.modelName = modelName;

  // set empty actions list on model and convert data
  metadata.actions = (metadata.actions || []).map(mapAction);

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

  log.trace('Model loaded: version \'%s\' model \'%s\' metadata %j',
    version, modelName, metadata);

  return metadata;
}

module.exports = load;
