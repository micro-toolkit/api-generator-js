var integrationHelper = require('../support/integration_helper'),
    request = require('supertest'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    stubs = require('../stubs/index'),
    blueprints = require('../blueprints/index');

chai.should();
chai.use(sinonChai);

describe('Integration: JSON Decoding', function(){
  var clientStub, app;

  before(function(){
    clientStub = integrationHelper.clientStub;
    var system = integrationHelper.before();
    app = system.app;
    clientStub = system.clientStub;
  });

  after(integrationHelper.after);

  describe('When sending invalid JSON in the body', function(){
    it('return a 400', function(done){
      request(app)
        .post('/v1/tasks')
        .send('{id: "foo}')
        .set({'Content-Type': 'application/json'})
        .expect(400)
        .expect('Content-Type', /json/)
        .end(done);
    });

    it('return a JSON parse error developerMessage', function(done){
      request(app)
        .post('/v1/tasks')
        .send('{id: "foo}')
        .set({'Content-Type': 'application/json'})
        .expect(function (response) {
          return response.body.developerMessage.should.eql('The JSON message sent is invalid');
        })
        .expect('Content-Type', /json/)
        .end(done);
    });
  });
});