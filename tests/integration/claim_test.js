var request = require('supertest'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    stubs = require('../stubs/index'),
    blueprints = require('../blueprints/index'),
    clientHelper = require('../support/client_helper'),
    express = require('express'),
    apiRouter = require('../../index');

chai.should();
chai.use(sinonChai);

describe('Integration: User Endpoints', function(){
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

  describe('GET /v1/admin/claims', function(){
    afterEach(function(){
      clientStub.list.restore();
    });

    it('return a model collection', function(done){
      var stub = sinon.stub().resolves([stubs.claim]);
      sinon.stub(clientStub, 'list').returns(stub());

      request(app)
        .get('/v1/admin/claims')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect([blueprints.claim])
        .end(done);
    });
  });

  describe('GET /v1/admin/claims/:id', function(){
    afterEach(function(){
      clientStub.get.restore();
    });

    it('return a model resource', function(done){
      var stub = sinon.stub().resolves(stubs.claim);
      sinon.stub(clientStub, 'get')
        .withArgs({id:'1'})
        .returns(stub());

      request(app)
        .get('/v1/admin/claims/1')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(blueprints.claim)
        .end(done);
    });
  });
});
