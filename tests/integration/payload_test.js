var integrationHelper = require('../support/integration_helper'),
    request = require('supertest'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    stubs = require('../stubs/index'),
    blueprints = require('../blueprints/index');

chai.should();
chai.use(sinonChai);

describe('Integration: Alerts Payload Endpoints', function(){
  var clientStub, app;

  before(function(){
    clientStub = integrationHelper.clientStub;
    var system = integrationHelper.before();
    app = system.app;
    clientStub = system.clientStub;
  });

  after(integrationHelper.after);

  describe('POST /v1/alerts', function(){
    it('return a 400 if the JSON sent is invalid', function(done){
      request(app)
        .post('/v1/alerts')
        .send('{id: "foo}')
        .set({'Content-Type': 'application/json'})
        .expect(400)
        .expect('Content-Type', /json/)
        .end(done);
    });

    it('return a JSON parse error developerMessage if the JSON sent is invalid', function(done){
      request(app)
        .post('/v1/alerts')
        .send('{id: "foo}')
        .set({'Content-Type': 'application/json'})
        .expect(400)
        .expect('Content-Type', /json/)
        .end(done);
    });
  });
});