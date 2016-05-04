var integrationHelper = require('../support/integration_helper'),
    request = require('supertest'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    stubs = require('../stubs/index');

chai.should();
chai.use(sinonChai);

describe('Integration: Custom Resource Endpoints', function (){
  var clientStub, app;

  before(function(){
    clientStub = integrationHelper.clientStub;
    var system = integrationHelper.before();
    app = system.app;
    clientStub = system.clientStub;
  });

  after(integrationHelper.after);

  describe('DELETE /v1/users/:id/active', function(){
    afterEach(function(){
      clientStub.call.restore();
    });

    it('return the specified status code response', function(done){
      sinon.stub(clientStub, 'call')
        .withArgs('deactivate', {id:'nick', token: 'someextrainfo' })
        .resolves({payload: stubs.user, status: 202});

      request(app)
        .delete('/v1/users/nick/active')
        .send({ token: 'someextrainfo' })
        .expect(202)
        .expect('Content-Type', /json/)
        .end(done);
    });

    it('return the default status code if nothing is specified', function(done){
      sinon.stub(clientStub, 'call')
        .withArgs('deactivate', {id:'nick', token: 'someextrainfo' })
        .resolves({payload: stubs.user});

      request(app)
        .delete('/v1/users/nick/active')
        .send({ token: 'someextrainfo' })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(done);
    });

  });
});

