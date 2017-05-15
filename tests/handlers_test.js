var chai = require('chai'),
    should = chai.should(),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    clientHelper = require('./support/client_helper'),
    stubs = require('./stubs/index'),
    Model = require('../lib/model'),
    _ = require('lodash');

chai.should();
chai.use(sinonChai);

describe('Handlers Generators', function(){
  var target, config, metadata, clientStub, req, res, actionStub, next, error;

  before(function(){
    clientStub = clientHelper.init();
  });

  after(function(){
    clientHelper.restore();
    clientStub = null;
  });

  beforeEach(function(){
    metadata = require('./metadata/index');
    config = {
      runtimeConfig: {
        baseUrl: 'http://test',
        documentationUrl: 'http://test#docs',
        excludeQueryString: ['token', 'access_token']
      },
      metadata: metadata
    };
    target = require('../lib/handlers')(config);
    req = { params: {}, query: {}, body: {}, requestId: '1' };
    res = {
      status: sinon.stub(),
      sendStatus: sinon.stub(),
      json: sinon.stub()
    };
    res.status.returns(res);
    next = _.noop;
    error = {
      code: 500,
      userMessage: 'user message',
      developerMessage: 'dev message'
    };
  });

  describe('#nonStandardAction', function () {
    beforeEach(function () {
      req.params.id = '1';
    });
    afterEach(function(){
      clientStub.call.restore();
    });

    it('should call micro client activate action', function(){
      var actionStub = sinon.stub(clientStub, 'call')
        .withArgs('activate')
        .resolves({payload: null});

      var action = metadata.v1.user.actions[1];
      target.nonStandardAction(metadata.v1.user, action)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with id on payload', function(){
      var actionStub = sinon.stub(clientStub, 'call')
        .withArgs('activate', {id:'1'})
        .resolves({payload: null});

      var action = metadata.v1.user.actions[1];
      target.nonStandardAction(metadata.v1.user, action)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with allowed property on payload', function(){
      var actionStub = sinon.stub(clientStub, 'call')
        .withArgs('action', sinon.match({prop: true}))
        .resolves({payload: null});

      req.body = { prop: true };
      var action = { httpVerb: 'put', name: 'action', verb: 'action', allow: ['prop'] };
      target.nonStandardAction(metadata.v1.user, action)(req, res, next);
      actionStub.should.have.been.called;
    });

    describe('enables embeded responses', function(){
      afterEach(function(){
        if (clientStub.batch.restore) {
          clientStub.batch.restore();
        }
      })

      it('should call micro client without embeds query string data', function(){
        var actionStub = sinon.stub(clientStub, 'call')
          .withArgs('activate', {id:'1'})
          .resolves({payload: null});
        req.query.embeds = 'tasks';

        var action = metadata.v1.user.actions[1];
        target.nonStandardAction(metadata.v1.user, action)(req, res, next);
        actionStub.should.have.been.calledWith('activate', {id: '1'});
      });

      it('should call micro client to retrieve embed resources', function(done){
        var task = { id: '1', userId: '99', active: true };
        sinon.stub(clientStub, 'call').resolves({payload: {id: '99'}});
        var actionStub = sinon.stub(clientStub, 'batch')
          .resolves({payload: [{ id: '99', data: [task] }]});
        req.query.embeds = 'tasks';

        var action = metadata.v1.user.actions[1];
        target.nonStandardAction(metadata.v1.user, action)(req, res, function(){
          actionStub.should.have.been.calledWith({userId: ['99']});
          done();
        });
      });

      it('should embed resource in response', function(done){
        var task = { id: '1', userId: '99', active: true };
        sinon.stub(clientStub, 'call').resolves({payload: {id: '99'}});
        var actionStub = sinon.stub(clientStub, 'batch')
          .resolves({payload: [{ userId: '99', data: [task] }]});
        req.query.embeds = 'tasks';

        var action = metadata.v1.user.actions[1];
        res.json = function(data){
          data.should.have.deep.property('tasks.0.id', '1');
          done();
        };
        target.nonStandardAction(metadata.v1.user, action)(req, res, next);
      });
    });

    describe('on call with response data', function(){
      var actionStub, action;

      beforeEach(function () {
        actionStub = sinon.stub(clientStub, 'call')
          .withArgs('activate', {id:'1'})
          .resolves({payload: stubs.user});
        action = metadata.v1.user.actions[1];
      });

      it('should set json response', function(done){
        var model = Model(config, metadata.v1.user)(stubs.user);
        // TODO: this isnt working with spy.should.have.been.called
        res.json = function(data){
          data.should.be.deep.equal(model);
          done();
        };
        var action = metadata.v1.user.actions[1];
        target.nonStandardAction(metadata.v1.user, action)(req, res, next);
      });

      describe('when response is a collection', function(){
        beforeEach(function () {
          clientStub.call.restore();
          actionStub = sinon.stub(clientStub, 'call')
            .resolves({payload: [stubs.alert]});
        });

        it('should set json response', function(done){
          var model = Model(config, metadata.v1.alert)(stubs.alert);
          // TODO: this isnt working with spy.should.have.been.called
          res.json = function(data){
            data.should.be.deep.equal([model]);
            done();
          };
          var action = metadata.v1.alert.actions[1];
          target.nonStandardAction(metadata.v1.alert, action)(req, res, next);
        });
      });

      it('should execute next handler', function(done){
        // TODO: use sinon chai and spy
        var spy = done;
        target.nonStandardAction(metadata.v1.user, action)(req, res, spy);
      });
    });

    describe('on call without response data', function(){
      var actionStub, action;

      beforeEach(function () {
        actionStub = sinon.stub(clientStub, 'call')
          .withArgs('deactivate', {id:'1'})
          .resolves({payload: null, status: 204});
        action = metadata.v1.user.actions[2];
      });

      it('should not set content', function(){
        target.nonStandardAction(metadata.v1.user, action)(req, res, next);
        res.json.should.not.have.been.called;
      });

      it('should send status code', function(done){
        res.sendStatus = function (status) {
          status.should.be.equal(204);
          done();
        }
        target.nonStandardAction(metadata.v1.user, action)(req, res, next);
      });

      it('should execute next handler', function(done){
        // TODO: use sinon chai and spy
        var spy = done;
        target.nonStandardAction(metadata.v1.user, action)(req, res, spy);
      });
    });

    describe('on call with a custom specified response code', function () {
      var actionStub, action;

      beforeEach(function () {
        actionStub = sinon.stub(clientStub, 'call')
          .withArgs('deactivate', {id:'1'})
          .resolves({payload: stubs.user, status: 202});
        action = metadata.v1.user.actions[2];
      })

      it('should return the status code it received in the response', function (done) {
        res.status = function (status) {
          status.should.be.eql(202);
          done();
        }
        target.nonStandardAction(metadata.v1.user, action)(req, res, next);
      });
    });

    describe('forwarding claims when configured', function(){
      var actionStub, action;

      beforeEach(function(){
        config.runtimeConfig.claims = ['userId','tenantId'];
        target = require('../lib/handlers')(config);
        req.user = { userId: '1', tenantId: '1' };
        actionStub = sinon.stub(clientStub, 'call')
          .withArgs('activate')
          .resolves({payload: null});

        action = metadata.v1.user.actions[1];
      });

      it('should call micro client with claims on headers', function(){
        target.nonStandardAction(metadata.v1.user, action)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match.any,
          sinon.match({ userId: '1', tenantId: '1' })
        );
      });

      it('should call micro client with request id on headers', function(){
        target.nonStandardAction(metadata.v1.user, action)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match.any,
          sinon.match({ 'X-REQUEST-ID': '1' })
        );
      });
    });

    describe('on micro client error', function(){
      beforeEach(function () {
        actionStub = sinon.stub(clientStub, 'call')
          .withArgs('activate')
          .rejects(error);
      });

      it('should set status with error code', function(done){
        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        var action = metadata.v1.user.actions[1];
        target.nonStandardAction(metadata.v1.user, action)(req, res, next);
      });

      it('should have json body with the error', function(done){
        res.json = function(error){
          error.should.be.eql({
            code: 'api_error',
            userMessage: 'user message',
            developerMessage: 'dev message',
            validationErrors: [],
            documentationUrl: 'http://test#docs'
          });
          done();
        };
        var action = metadata.v1.user.actions[1];
        target.nonStandardAction(metadata.v1.user, action)(req, res, next);
      });

      it('should execute next handler', function(done){
        // TODO: use sinon chai and spy
        var spy = done;
        var action = metadata.v1.user.actions[1];
        target.nonStandardAction(metadata.v1.user, action)(req, res, spy);
      });
    });
  });
});
