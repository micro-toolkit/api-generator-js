var integrationHelper = require('../support/integration_helper'),
    request = require('supertest'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    stubs = require('../stubs/index'),
    blueprints = require('../blueprints/index');

chai.should();
chai.use(sinonChai);

describe('Integration: Tasks Endpoints', function(){
  var clientStub, app;

  before(function(){
    clientStub = integrationHelper.clientStub;
    var system = integrationHelper.before();
    app = system.app;
    clientStub = system.clientStub;
  });

  after(integrationHelper.after);

  describe('GET /v1/tasks', function(){
    afterEach(function(){
      clientStub.list.restore();
    });

    it('return a collection', function(done){
      sinon.stub(clientStub, 'list')
        .resolves({payload: [stubs.task]});

      request(app)
        .get('/v1/tasks')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect([blueprints.task])
        .end(done);
    });

    it('return a collection with offset and limit', function(done){
      sinon.stub(clientStub, 'list')
        .withArgs({limit: 1, offset: 2})
        .resolves({payload: [stubs.task]});

      request(app)
        .get('/v1/tasks?offset=2&limit=1')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect([blueprints.task])
        .end(done);
    });

    it('returns a error', function (done) {
      var error = {
        code: 500,
        userMessage: 'user message',
        developerMessage: 'dev message'
      };
      var expectedError = {
        code: 'api_error',
        userMessage: error.userMessage,
        developerMessage: error.developerMessage,
        validationErrors: [],
        documentationUrl: 'http://test#docs'
      };
      var stub = sinon.stub().rejects(error);
      sinon.stub(clientStub, 'list').returns(stub());

      request(app)
        .get('/v1/tasks')
        .expect(500)
        .expect('Content-Type', /json/)
        .expect(expectedError)
        .end(done);
    });
  });

  describe('GET /v1/tasks/:id', function(){
    afterEach(function(){
      clientStub.get.restore();
    });

    it('return a model resource', function(done){
      sinon.stub(clientStub, 'get')
        .withArgs({id:'1'})
        .resolves({payload: stubs.task});

      request(app)
        .get('/v1/tasks/1')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(blueprints.task)
        .end(done);
    });
  });

  describe('DELETE /v1/tasks/:id', function(){
    afterEach(function(){
      clientStub.remove.restore();
    });

    it('return no content', function(done){
      sinon.stub(clientStub, 'remove')
        .withArgs({id:'1'})
        .resolves({payload: stubs.task, status: 204});

      request(app)
        .delete('/v1/tasks/1')
        .expect(204, done);
    });
  });

  describe('GET /v1/users/1/tasks', function(){
    afterEach(function(){
      clientStub.list.restore();
    });

    it('return a collection', function(done){
      sinon.stub(clientStub, 'list')
        .withArgs(sinon.match({ userId: '1' }))
        .resolves({payload: [stubs.task]});

      request(app)
        .get('/v1/users/1/tasks')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect([blueprints.task])
        .end(done);
    });
  });

  describe('GET /v1/users/1/tasks/count', function(){
    afterEach(function(){
      clientStub.count.restore();
    });

    it('return a collection', function(done){
      sinon.stub(clientStub, 'count')
        .withArgs(sinon.match({ userId: '1' }))
        .resolves({payload: 1});

      request(app)
        .get('/v1/users/1/tasks/count')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ count: 1 })
        .end(done);
    });
  });

});
