var jsonParser = require('body-parser').json(),
    _ = require('lodash');

function actionPresent(actions, action){
  return actions.indexOf(action) !== -1;
}

function listRoute(metadata, paths, handlers){
  if (!actionPresent(metadata.actions, 'list')) { return null; }

  return {
    verb:     'get',
    path:     paths.collection(metadata),
    handler:  handlers.collection(metadata)
  };
}

function getRoute(metadata, paths, handlers){
  if (!actionPresent(metadata.actions, 'get')) { return null; }

  return {
    verb:     'get',
    path:     paths.resource(metadata),
    handler:  handlers.getResource(metadata)
  };
}

function createRoute(metadata, paths, handlers){
  if (!actionPresent(metadata.actions, 'create')) { return null; }

  return {
    verb:       'post',
    path:       paths.collection(metadata),
    handler:    handlers.createResource(metadata),
    middleware: jsonParser
  };
}

function updateRoute(metadata, paths, handlers){
  if (!actionPresent(metadata.actions, 'update')) { return null; }

  return {
    verb:       'put',
    path:       paths.resource(metadata),
    handler:    handlers.updateResource(metadata),
    middleware: jsonParser
  };
}

function removeRoute(metadata, paths, handlers){
  if (!actionPresent(metadata.actions, 'remove')) { return null; }

  return {
    verb:       'delete',
    path:       paths.resource(metadata),
    handler:    handlers.removeResource(metadata)
  };
}

function relationRoute(relation, paths, handlers){
  var isCollection = relation.type === 'collection';

  // only define routes for subresources and not to direct resources
  if (!isCollection) { return null; }

  return {
    verb:       'get',
    path:       paths.resourceRelation(relation),
    handler:    handlers.resourceRelation(relation)
  };
}

function relationsRoutes(metadata, paths, handlers){
  return metadata.relations.map(function(relation){
    return relationRoute(relation, paths, handlers);
  });
}

function nonStandardActionRoute(metadata, action, paths, handlers){
  return {
    verb:       action.httpVerb,
    path:       paths.nonStandardAction(metadata, action),
    handler:    handlers.nonStandardAction(metadata, action),
    middleware: jsonParser
  };
}

function nonStandardActionRoutes(metadata, paths, handlers) {
  return metadata.actions.map(function(action){
    // check if the action is a standard action
    if (typeof action === 'string') { return null; }

    return nonStandardActionRoute(metadata, action, paths, handlers);
  });
}

function modelRoutes(config, metadata) {
  var paths = require('./paths')(config);
  var handlers = require('./handlers')(config);

  return _.compact(
    _.flatten([
      // non standard should be loaded first
      // to avoid class with resource routes
      nonStandardActionRoutes(metadata, paths, handlers),
      listRoute(metadata, paths, handlers),
      getRoute(metadata, paths, handlers),
      createRoute(metadata, paths, handlers),
      updateRoute(metadata, paths, handlers),
      removeRoute(metadata, paths, handlers),
      relationsRoutes(metadata, paths, handlers)
    ])
  );
}

module.exports = modelRoutes;
