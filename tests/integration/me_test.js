var integrationHelper = require('../support/integration_helper'),
    request = require('supertest'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    stubs = require('../stubs/index'),
    blueprints = require('../blueprints/index');

chai.should();
chai.use(sinonChai);

describe('Integration: Me Endpoints', function(){
  var clientStub, app;

  before(function(){
    clientStub = integrationHelper.clientStub;
    var system = integrationHelper.before();
    app = system.app;
    clientStub = system.clientStub;
  });

  after(integrationHelper.after);

  describe('GET /v1/me', function(){
    afterEach(function(){
      clientStub.get.restore();
    });

    it('return a model', function(done){
      sinon.stub(clientStub, 'get')
        .withArgs(sinon.match({ id: 'pjanuario' }))
        .resolves(stubs.user);

      request(app)
        .get('/v1/me')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(blueprints.me)
        .end(done);
    });
  });
});
