var integrationHelper = require('../support/integration_helper'),
    request = require('supertest'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    stubs = require('../stubs/index'),
    blueprints = require('../blueprints/index');

chai.should();
chai.use(sinonChai);

describe('Middleware', function(){
  var clientStub, app;

  before(function(){
    clientStub = integrationHelper.clientStub;
    var system = integrationHelper.before();
    app = system.app;
    clientStub = system.clientStub;
  });

  after(integrationHelper.after);

  describe('Partial response', function(){
    afterEach(function(){
      clientStub.get.restore();
    });

    it('should return a model with specified fields only', function(done){
      sinon.stub(clientStub, 'get')
        .withArgs({id:'pjanuario'})
        .resolves({payload: stubs.user});

      request(app)
        .get('/v1/users/pjanuario?fields=id,name')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ id: blueprints.user.id, name: blueprints.user.name }, done);
    });
  });
});
