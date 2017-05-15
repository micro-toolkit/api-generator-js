var Logger = require('../logger'),
    log = Logger.getLogger('micro.api.handler.embeds'),
    clientFactory = require('./client'),
    model = require('./model'),
    _ = require('lodash'),
    getHeaders = require('./headers');

function isCollectionRelation(relation) {
  return relation.type === 'collection';
}

function getEmbedsFromQuery(query) {
  if (query && query.embeds) {
    return query.embeds.split(',');
  }

  return [];
}

function serialize(toModel, item){
  if (_.isArray(item.data)){
    item.data = item.data.map(toModel);
  } else {
    item.data = toModel(item.data);
  }
  return item;
}

function fetchEmbed(relations, config, data, headers){
  var promises = relations.map(function(relation){
    var parent = config.metadata[relation.version][relation.parent];
    var isCollection = isCollectionRelation(relation);
    var isResource = !isCollection;
    var idKey = isCollection ? parent.idKey : relation.modelFk;
    var metadata = config.metadata[relation.version][relation.model];
    var client = clientFactory.init(metadata.modelName, config.runtimeConfig);
    var toModel = model(config, metadata);
    var payloadKey = isResource ? parent.idKey : relation.modelFk;
    var payload = {};
    payload[payloadKey] = _.map(data, idKey);

    log.debug('Embeds subresource %s in request', relation.name);
    return client.batch(payload, headers)
      .then(function(response){
        log.debug(response, 'Embeds subresource %s received data!',
          relation.name);
        var embedData = {};
        var serializeModel = _.partial(serialize, toModel);
        embedData[relation.name] = response.payload.map(serializeModel);
        return embedData;
      })
      .catch(function(err){
        log.warn(err, 'Embeds subresource %s received a error', relation.name);
        var embedData = {};
        embedData[relation.name] = null;
        return embedData;
      });
  });
  return Promise.all(promises);
}

// { user: { id: 1, data: {name: 'name'} }}
// { tasks: { userId: 1, data: { id: 2, userId: 1, active: true } }}

function mergeEmbed(metadata, relations, embedResponses, model) {
  return embedResponses.reduce(function(memo, embed){
    var relationName = _.first(Object.keys(embed));
    var relation = _.find(relations, {name: relationName});
    var isCollection = isCollectionRelation(relation);
    var isResource = !isCollection;
    var idKey = isCollection ? metadata.idKey : relation.modelFk;
    var relationId = memo[idKey];
    var filter = {};
    filter[isResource ? metadata.idKey : relation.modelFk] = relationId;
    var relationData = _.find(embed[relationName], filter);
    memo[relationName] = relationData ? relationData.data  : null;
    return memo;
  }, model);
}

function getEmbedsRelations(query, relations) {
  var embeds = getEmbedsFromQuery(query);

  return _.filter(relations, function(rel){
    return _.includes(embeds, rel.name);
  });
}

function embeds(metadata, config, req, data) {
  var relations = getEmbedsRelations(req.query, metadata.relations);
  var isArray = _.isArray(data);
  var isWithoutRelations = !relations.length;
  var isEmptyData = !data || (isArray && data.length == 0);
  if (isWithoutRelations || isEmptyData) { return Promise.resolve(data); }

  data = isArray ? data : [data];
  var headers = getHeaders(req, config.runtimeConfig.claims);

  return fetchEmbed(relations, config, data, headers)
    .then(function(embedResponses){
      var decorate = _.partial(mergeEmbed, metadata, relations, embedResponses);
      return data.map(decorate);
    })
    .then(function(models) {
      return isArray ? models : _.first(models);
    });
}

module.exports = embeds;
