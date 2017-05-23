var jsonParser = require('./middleware/json_parser'),
    Logger = require('../logger'),
    log = Logger.getLogger('micro.api.routes'),
    _ = require('lodash');

function actionPresent(actions, action){
  return actions.indexOf(action) !== -1;
}

function listRoute(metadata, paths, handlers){
  if (!actionPresent(metadata.actions, 'list')) { return null; }

  log.trace(metadata, 'Loading list route');

  return {
    verb:     'get',
    path:     paths.collection(metadata),
    handler:  handlers.collection(metadata)
  };
}

function countRoute(metadata, paths, handlers){
  if (!actionPresent(metadata.actions, 'count')) { return null; }

  log.trace(metadata, 'Loading count route');

  return {
    verb:     'get',
    path:     paths.collectionCount(metadata),
    handler:  handlers.collectionCount(metadata)
  };
}

function getRoute(metadata, paths, handlers){
  if (!actionPresent(metadata.actions, 'get')) { return null; }

  log.trace(metadata, 'Loading get route');

  return {
    verb:     'get',
    path:     paths.resource(metadata),
    handler:  handlers.getResource(metadata)
  };
}

function createRoute(metadata, paths, handlers){
  if (!actionPresent(metadata.actions, 'create')) { return null; }

  log.trace(metadata, 'Loading create route');

  return {
    verb:       'post',
    path:       paths.collection(metadata),
    handler:    handlers.createResource(metadata),
    middleware: jsonParser
  };
}

function updateRoute(metadata, paths, handlers){
  if (!actionPresent(metadata.actions, 'update')) { return null; }

  log.trace(metadata, 'Loading update route');

  return {
    verb:       'put',
    path:       paths.resource(metadata),
    handler:    handlers.updateResource(metadata),
    middleware: jsonParser
  };
}

function removeRoute(metadata, paths, handlers){
  if (!actionPresent(metadata.actions, 'remove')) { return null; }

  log.trace(metadata, 'Loading remove route');

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

  log.trace(relation, 'Loading relation route');

  var routes = [{
    verb:       'get',
    path:       paths.resourceRelation(relation),
    handler:    handlers.resourceRelation(relation)
  }];

  if (relation.count){
    log.trace(relation, 'Loading relation count route');
    routes.push({
      verb:       'get',
      path:       paths.resourceRelationCount(relation),
      handler:    handlers.resourceRelationCount(relation)
    });
  }

  return routes;
}

function relationsRoutes(metadata, paths, handlers){
  return _.flatten(metadata.relations.map(function(relation){
    return relationRoute(relation, paths, handlers);
  }));
}

function nonStandardActionRoute(metadata, action, paths, handlers){
  log.trace(metadata, 'Loading non standard action route %s', action);

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

    log.trace(metadata, 'Loading non standard routes');
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
      countRoute(metadata, paths, handlers),
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
