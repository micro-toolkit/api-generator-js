var integrationHelper = require('../support/integration_helper'),
    request = require('supertest'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    stubs = require('../stubs/index'),
    blueprints = require('../blueprints/index');

chai.should();
chai.use(sinonChai);

describe('Integration: Alerts Endpoints', function(){
  var clientStub, app;

  before(function(){
    clientStub = integrationHelper.clientStub;
    var system = integrationHelper.before();
    app = system.app;
    clientStub = system.clientStub;
  });

  after(integrationHelper.after);

  describe('GET /v1/me/alerts', function(){
    afterEach(function(){
      clientStub.list.restore();
    });

    it('return a model', function(done){
      sinon.stub(clientStub, 'list')
        .withArgs(sinon.match({ userId: 'pjanuario' }))
        .resolves({payload: [stubs.alert]});

      request(app)
        .get('/v1/me/alerts')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect([blueprints.alert])
        .end(done);
    });
  });

  describe('GET /v1/alerts/recent', function(){
    afterEach(function(){
      clientStub.call.restore();
    });

    it('return a model', function(done){
      sinon.stub(clientStub, 'call')
        .withArgs('recent')
        .resolves({payload: [stubs.alert]});

      request(app)
        .get('/v1/alerts/recent')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect([blueprints.alert])
        .end(done);
    });
  });

  describe('GET /v1/alerts/:id', function(){
    afterEach(function(){
      clientStub.get.restore();
    });

    it('return a model', function(done){
      sinon.stub(clientStub, 'get')
        .withArgs(sinon.match({ id: '1' }))
        .resolves({payload: stubs.alert});

      request(app)
        .get('/v1/alerts/1')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(blueprints.alert)
        .end(done);
    });
  });
});
