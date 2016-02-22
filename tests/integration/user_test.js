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
  var app, clientStub;

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
    app.listen(8089);
  });

  after(function(){
    clientHelper.restore();
    clientStub = null;
  });

  describe('GET /v1/users', function(){
    it('should return not found', function(done){
      request(app)
        .get('/v1/users')
        .expect(404)
        .end(done);
    });
  });

  describe('GET /v1/users/:id', function(){
    afterEach(function(){
      clientStub.get.restore();
    });

    it('return a model resource', function(done){
      var stub = sinon.stub().resolves(stubs.user);
      sinon.stub(clientStub, 'get')
        .withArgs({id:'pjanuario'})
        .returns(stub());

      request(app)
        .get('/v1/users/pjanuario')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(blueprints.user)
        .end(done);
    });
  });

  describe('POST /v1/users', function(){
    it('should return not found', function(done){
      request(app)
        .post('/v1/users')
        .expect(404)
        .end(done);
    });
  });

  describe('PUT /v1/users/pjanuario', function(){
    it('should return not found', function(done){
      request(app)
        .post('/v1/users/pjanuario')
        .expect(404)
        .end(done);
    });
  });

  describe('DELETE /v1/users', function(){
    it('should return not found', function(done){
      request(app)
        .delete('/v1/users/pjanuario')
        .expect(404)
        .end(done);
    });
  });

  describe('PUT /v1/users/:id/active', function(){
    afterEach(function(){
      clientStub.call.restore();
    });

    it('return a model resource', function(done){
      var stub = sinon.stub().resolves(stubs.user);
      sinon.stub(clientStub, 'call')
        .withArgs('activate', {id:'pjanuario'})
        .returns(stub());

      request(app)
        .put('/v1/users/pjanuario/active')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(blueprints.user)
        .end(done);
    });
  });

  describe('DELETE /v1/users/:id/active', function(){
    afterEach(function(){
      clientStub.call.restore();
    });

    it('return a model resource', function(done){
      var stub = sinon.stub().resolves();
      sinon.stub(clientStub, 'call')
        .withArgs('deactivate', {id:'pjanuario'})
        .returns(stub());

      request(app)
        .delete('/v1/users/pjanuario/active')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(done);
    });
  });

});
