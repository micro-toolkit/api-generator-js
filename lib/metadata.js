var util = require('util'),
    _ = require('lodash'),
    inflection = require('lodash-inflection'),
    Logger = require('../logger'),
    log = Logger.getLogger('micro.api.metadata.loader');

_.mixin(inflection);

var standardActions = ['list', 'get', 'create', 'update', 'remove'];
var nonStandardActionAllowedHttpVerbs = ['get', 'put', 'delete', 'post'];

function isStandardAction(action){
  var isStringAction = typeof action === 'string';
  var isStandardAction = standardActions.indexOf(action) !== -1;
  return isStringAction && isStandardAction;
}

function isInvalidAction(action){
  // check if the action is a standard action
  if (isStandardAction(action)) { return null; }

  var isStringAction = typeof action === 'string';
  if (isStringAction) { return 'standard action'; }

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
    verb:     action.verb.toLowerCase(),
    resource: action.resource !== false, // default to true
    allow: action.allow || []
  };
}

function loadPath(metadataPath) {
  var path = { prefix: null, value: null };

  if (!metadataPath) { return path; }

  if (typeof metadataPath === 'string') {
    return { prefix: null, value: metadataPath };
  }

  return _.defaults(metadataPath, path);
}

function load(version, modelName, metadata){
  log.trace('Loading Model: version \'%s\' model \'%s\' metadata %j',
    version, modelName, metadata);

  // clone the initial dictionary before start changing it
  metadata = _.cloneDeep(metadata);

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

  // set default paths
  metadata.path = loadPath(metadata.path);

  // set the default current user key
  metadata.currentUserKey = metadata.currentUserKey || null;

  // set default id key
  metadata.idKey = metadata.idKey || 'id';

  // set relations model when not overwritten
  metadata.relations = metadata.relations.map(function(relation){
    var isCollection = relation.type === 'collection';
    var rel = {
      type: relation.type,
      name: relation.name,
      version: metadata.version,
      model: relation.model || _.singularize(relation.name),
      parent: metadata.modelName,
      count: relation.count || false
    };
    var fk = isCollection ? rel.parent + 'Id' : rel.model + 'Id';
    rel.modelFk = relation.modelFk || fk;
    return rel;
  });

  log.trace('Model loaded: version \'%s\' model \'%s\' metadata %j',
    version, modelName, metadata);

  return metadata;
}

module.exports = load;
