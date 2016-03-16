var clientHelper = require('../support/client_helper'),
    express = require('express'),
    apiRouter = require('../../index');

var server;

function authFakeMiddleware(req, res, next) {
  req.user = { userId: 'pjanuario' };
  return next();
}

function setupServer(){
  var clientStub = clientHelper.init();
  var metadata = require('../metadata/index');
  var config = {
    runtimeConfig: {
      baseUrl: 'http://test',
      documentationUrl: 'http://test#docs'
    },
    metadata: metadata
  };
  var app = express();
  var router = apiRouter(config);
  app.use(authFakeMiddleware);
  app.use(router);
  server = app.listen(8090);
  return {
    app: app,
    clientStub: clientStub
  };
}

function destroyServer(){
  clientHelper.restore();
  server.close();
  server = null;
}

module.exports = { before: setupServer, after: destroyServer };
