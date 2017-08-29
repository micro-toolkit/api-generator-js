var integrationHelper = require('../support/integration_helper'),
    request = require('supertest'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    stubs = require('../stubs/index'),
    blueprints = require('../blueprints/index');

chai.should();
chai.use(sinonChai);

describe('Integration: Metrics Endpoints', function(){
  var clientStub, app;

  before(function(){
    clientStub = integrationHelper.clientStub;
    var system = integrationHelper.before();
    app = system.app;
    clientStub = system.clientStub;
  });

  after(integrationHelper.after);

  describe('GET /v1/computeinstances/:id/metrics/live', function(){
    afterEach(function(){
      clientStub.call.restore();
    });

    it('uses model route instead of ci relation route', function(done){
      sinon.stub(clientStub, 'call')
        .withArgs('live', sinon.match.any, sinon.match.any)
        .resolves({payload: stubs.metric, status: 200});

      request(app)
        .get('/v1/computeinstances/1bac15021d754e68b3ddd370d9e14c3f/metrics/live')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(blueprints.metric)
        .end(done);
    });
  });
});
