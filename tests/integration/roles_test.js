var clientHelper = require('../support/client_helper'),
    request = require('supertest'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    stubs = require('../stubs/index'),
    blueprints = require('../blueprints/index'),
    express = require('express'),
    apiRouter = require('../../index');

chai.should();
chai.use(sinonChai);

describe('Integration: Roles Endpoints', function(){
  var app, clientStub, server;

  before(function(){
    clientStub = clientHelper.init();
    var metadata = require('../metadata/index');
    var config = {
      runtimeConfig: { baseUrl: 'http://test' },
      metadata: metadata
    };
    app = express();
    var router = apiRouter(config);
    app.use(router);
    server = app.listen(8089);
  });

  after(function(){
    clientHelper.restore();
    clientStub = null;
    server.close();
    server = null;
  });

  describe('GET /v1/users/:userId/roles', function(){
    afterEach(function(){
      clientStub.list.restore();
    });

    it('should return a collection of models', function(done){
      var stub = sinon.stub().resolves([stubs.role]);
      sinon.stub(clientStub, 'list')
        .withArgs(sinon.match({userId:'pjanuario'}))
        .returns(stub());

      request(app)
        .get('/v1/users/pjanuario/roles')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect([blueprints.role])
        .end(done);
    });
  });

  describe('GET /v1/users/:userId/roles/:id', function(){
    afterEach(function(){
      clientStub.get.restore();
    });

    it('return a model resource', function(done){
      var stub = sinon.stub().resolves(stubs.role);
      sinon.stub(clientStub, 'get')
        .withArgs({userId:'pjanuario', id: '1'})
        .returns(stub());

      request(app)
        .get('/v1/users/pjanuario/roles/1')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(blueprints.role)
        .end(done);
    });
  });

});
