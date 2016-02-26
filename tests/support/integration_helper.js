var clientHelper = require('../support/client_helper'),
    express = require('express'),
    apiRouter = require('../../index');

var server;

function setupServer(){
  var clientStub = clientHelper.init();
  var metadata = require('../metadata/index');
  var config = {
    runtimeConfig: { baseUrl: 'http://test' },
    metadata: metadata
  };
  var app = express();
  var router = apiRouter(config);
  app.use(router);
  server = app.listen(8089);
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
