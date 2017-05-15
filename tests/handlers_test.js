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

  describe('#removeResource', function(){
    afterEach(function(){
      clientStub.remove.restore();
    });

    it('should call micro client remove action', function(){
      var actionStub = sinon.stub(clientStub, 'remove')
        .resolves({payload: null});
      target.removeResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request id parameter', function(){
      var actionStub = sinon.stub(clientStub, 'remove')
        .resolves({payload: null});
      req.params.id = '1';
      target.removeResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({id:'1'});
    });

    it('should return no content status code', function(done){
      var actionStub = sinon.stub(clientStub, 'remove')
        .resolves({payload: null, status: 204});
      res.sendStatus = function (status) {
        status.should.be.equal(204);
        done();
      }
      target.removeResource(metadata.v1.task)(req, res, next);
    });

    it('should execute next handler', function(done){
      sinon.stub(clientStub, 'remove').resolves({payload: null});
      // TODO: use sinon chai and spy
      var spy = done;
      target.removeResource(metadata.v1.task)(req, res, spy);
    });

    describe('forwarding claims when configured', function(){
      var actionStub;

      beforeEach(function(){
        config.runtimeConfig.claims = ['userId','tenantId'];
        target = require('../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'remove')
          .resolves({payload: null});
        req.user = { userId: '1', tenantId: '1' };
      });

      it('should call micro client with claims on headers', function(){
        target.removeResource(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ userId: '1', tenantId: '1' })
        );
      });

      it('should call micro client with request id on headers', function(){
        target.removeResource(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ 'X-REQUEST-ID': '1' })
        );
      });
    });

    describe('on micro client error', function(){
      beforeEach(function () {
        actionStub = sinon.stub(clientStub, 'remove').rejects(error);
      });

      it('should set status with error code', function(done){
        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.removeResource(metadata.v1.task)(req, res, next);
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
        target.removeResource(metadata.v1.task)(req, res, next);
      });

      it('should execute next handler', function(done){
        // TODO: use sinon chai and spy
        var spy = done;
        target.removeResource(metadata.v1.task)(req, res, spy);
      });
    });
  });

  describe('#resourceRelationCount', function(){
    afterEach(function(){
      if(clientStub.count.restore) { clientStub.count.restore(); }
    });

    it('should init the proper micro client', function(){
      var client = require('../lib/client');
      var spy = client.init;
      var expected = metadata.v1.task;
      target.resourceRelationCount(metadata.v1.user.relations[0]);
      spy.should.have.been.calledWith('task', sinon.match.any);
    });

    it('should call micro client count action', function(){
      var actionStub = sinon.stub(clientStub, 'count')
        .resolves({payload: 0});
      target.resourceRelationCount(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with resource foreign key', function(){
      var actionStub = sinon.stub(clientStub, 'count')
        .resolves({payload: 0});
      req.params.id = '1';
      target.resourceRelationCount(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.calledWith(sinon.match({ userId: '1' }));
    });

    describe('when parent metadata with current user', function () {
      it('should call micro client with current user key', function(){
        var actionStub = sinon.stub(clientStub, 'count')
          .resolves({payload: 0});
        req.user = { userId: '1' };
        target.resourceRelationCount(metadata.v1.me.relations[0])(req, res, next);
        actionStub.should.have.been.calledWith(sinon.match({ userId: '1' }));
      });
    });

    it('should call micro client with request query string data', function(){
      var actionStub = sinon.stub(clientStub, 'count')
        .resolves({payload: 0});
      req.query.unread = true;
      target.resourceRelationCount(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.calledWith(sinon.match({ unread: true }));
    });

    it('should set json response on successfull call', function(done){
      sinon.stub(clientStub, 'count').resolves({payload: 1 });
      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal({ count: 1 });
        done();
      }
      target.resourceRelationCount(metadata.v1.user.relations[0])(req, res, next);
    });

    it('should execute next handler', function(done){
      sinon.stub(clientStub, 'count').resolves({payload: 1});
      // TODO: use sinon chai and spy
      var spy = done;
      target.resourceRelationCount(metadata.v1.user.relations[0])(req, res, spy);
    });

    describe('forwarding claims when configured', function(){
      var actionStub;

      beforeEach(function(){
        config.runtimeConfig.claims = ['userId','tenantId'];
        target = require('../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'count').resolves({payload: 0});
        req.user = { userId: '1', tenantId: '1' };
      });

      it('should call micro client with claims on headers', function(){
        target.resourceRelationCount(metadata.v1.user.relations[0])(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ userId: '1', tenantId: '1' })
        );
      });

      it('should call micro client with request id on headers', function(){
        target.resourceRelationCount(metadata.v1.user.relations[0])(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ userId: '1', tenantId: '1' })
        );
      });
    });

    describe('on micro client error', function(){
      beforeEach(function () {
        actionStub = sinon.stub(clientStub, 'count').rejects(error);
      });

      it('should set status with error code', function(done){
        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.resourceRelationCount(metadata.v1.user.relations[0])(req, res, next);
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
        target.resourceRelationCount(metadata.v1.user.relations[0])(req, res, next);
      });

      it('should execute next handler', function(done){
        // TODO: use sinon chai and spy
        var spy = done;
        target.resourceRelationCount(metadata.v1.user.relations[0])(req, res, spy);
      });
    });
  });

  describe('#resourceRelation', function(){
    afterEach(function(){
      clientStub.list.restore();
    });

    it('should call micro client list action', function(){
      var actionStub = sinon.stub(clientStub, 'list')
        .resolves({payload: []});
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with resource foreign key', function(){
      var actionStub = sinon.stub(clientStub, 'list')
        .resolves({payload: []});
      req.params.id = '1';
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.calledWith(sinon.match({ userId: '1' }));
    });

    it('should not call micro client with id key', function(){
      var actionStub = sinon.stub(clientStub, 'list')
        .resolves({payload: []});
      req.params.id = '1';
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.not.have.been.calledWith(sinon.match({ id: '1' }));
    });

    describe('when parent metadata with current user', function () {
      it('should call micro client with current user key', function(){
        var actionStub = sinon.stub(clientStub, 'list')
          .resolves({payload: []});
        req.user = { userId: '1' };
        target.resourceRelation(metadata.v1.me.relations[0])(req, res, next);
        actionStub.should.have.been.calledWith(sinon.match({ userId: '1' }));
      });
    });

    it('should call micro client with limit and offset defaults', function(){
      var actionStub = sinon.stub(clientStub, 'list')
        .resolves({payload: []});
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.calledWith(sinon.match({ limit: 10, offset: 0 }));
    });

    it('should call micro client with request limit and offset', function(){
      var actionStub = sinon.stub(clientStub, 'list')
        .resolves({payload: []});
      req.query.limit = 2;
      req.query.offset = 1;
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.calledWith(
        sinon.match({ limit: 2, offset: 1 }));
    });

    it('should call micro client with request query string data', function(){
      var actionStub = sinon.stub(clientStub, 'list')
        .resolves({payload: []});
      req.query.unread = true;
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.calledWith(sinon.match({ unread: true }));
    });

    it('should set json response on successfull call', function(done){
      var task = { id: '1', userId: '99', active: true };
      var model = Model(config, metadata.v1.task)(task);
      sinon.stub(clientStub, 'list').resolves({payload: [task]});
      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal([model]);
        done();
      }
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
    });

    it('should execute next handler', function(done){
      var task = { id: '1', userId: '99', active: true };
      var model = Model(config, metadata.v1.task)(task);
      sinon.stub(clientStub, 'list').resolves({payload: [task]});
      // TODO: use sinon chai and spy
      var spy = done;
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, spy);
    });

    describe('excluding query string parameters from payload', function(){
      it('should call micro client without token', function(){
        var actionStub = sinon.stub(clientStub, 'list')
          .resolves({payload: []});
        req.query.token = 'secretToken';
        target.collection(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
      });

      it('should call micro client without excluded query string params',
      function(){
        config.runtimeConfig.excludeQueryString = ['other'];
        target = require('../lib/handlers')(config);
        var actionStub = sinon.stub(clientStub, 'list')
                .resolves({payload: []});
        req.query.other = 'other';
        target.collection(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
      });
    });

    describe('enables embeded responses', function(){
      afterEach(function(){
        if (clientStub.batch.restore) {
          clientStub.batch.restore();
        }
      })

      it('should call micro client without embeds query string data', function(){
        var task = { id: '1', userId: '99', active: true };
        req.query.embeds = 'user';
        req.params.id = '99';
        var actionStub = sinon.stub(clientStub, 'list')
          .resolves({payload: [task]});
        sinon.stub(clientStub, 'batch')
          .withArgs({id: ['99']})
          .resolves({payload: [{ id: '99', data: {id: '99'} }]});
        target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
        actionStub.should.have.been.calledWith({offset: 0, limit: 10, userId: '99'})
      });

      it('should call micro client to retrieve embed resources', function(done){
        var task = { id: '1', userId: '99', active: true };
        req.query.embeds = 'user';
        req.params.id = '99';
        sinon.stub(clientStub, 'list').resolves({payload: [task]});
        var actionStub = sinon.stub(clientStub, 'batch')
          .withArgs({id: ['99']})
          .resolves({payload: [{ id: '99', data: {id: '99'} }]});
        target.resourceRelation(metadata.v1.user.relations[0])(req, res, function(){
          actionStub.should.been.calledWith({id: ['99']});
          done();
        });
      });

      it('should embed resource in response', function(done){
        var task = { id: '1', userId: '99', active: true };
        req.query.embeds = 'user';
        req.params.id = '99';
        sinon.stub(clientStub, 'list').resolves({payload: [task]});
        var actionStub = sinon.stub(clientStub, 'batch')
          .withArgs({id: ['99']})
          .resolves({payload: [{ id: '99', data: {id: '99'} }]});
        res.json = function(data){
          data.should.have.deep.property('0.user.id', '99');
          done();
        };
        target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      });
    });

    describe('forwarding claims when configured', function(){
      var actionStub;

      beforeEach(function(){
        config.runtimeConfig.claims = ['userId','tenantId'];
        target = require('../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'list').resolves({payload: []});
        req.user = { userId: '1', tenantId: '1' };
      });

      it('should call micro client with claims on headers', function(){
        target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ userId: '1', tenantId: '1' })
        );
      });

      it('should call micro client with request id on headers', function(){
        target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ userId: '1', tenantId: '1' })
        );
      });
    });

    describe('on micro client error', function(){
      beforeEach(function () {
        actionStub = sinon.stub(clientStub, 'list').rejects(error);
      });

      it('should set status with error code', function(done){
        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
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
        target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      });

      it('should execute next handler', function(done){
        // TODO: use sinon chai and spy
        var spy = done;
        target.resourceRelation(metadata.v1.user.relations[0])(req, res, spy);
      });
    });
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
