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
        documentationUrl: 'http://test#docs'
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

  describe('#collection', function(){
    afterEach(function(){
      clientStub.list.restore();
    });

    it('should call micro client list action', function(){
      var actionStub = sinon.stub(clientStub, 'list').resolves({payload:[]});
      target.collection(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with limit and offset defaults', function(){
      var actionStub = sinon.stub(clientStub, 'list').resolves({payload:[]});
      target.collection(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
    });

    it('should call micro client with request limit and offset', function(){
      var actionStub = sinon.stub(clientStub, 'list').resolves({payload:[]});
      req.query.limit = 2;
      req.query.offset = 1;
      target.collection(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({ limit: 2, offset: 1 });
    });

    it('should call micro client with request limit and offset as integers', function() {
      var actionStub = sinon.stub(clientStub, 'list').resolves({payload:[]});
      req.query.limit = '2';
      req.query.offset = '1';
      target.collection(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({ limit: 2, offset: 1 });
    });

    it('should call micro client with default limit and offset when request limit and offset are NaN', function() {
      var actionStub = sinon.stub(clientStub, 'list').resolves({payload:[]});
      req.query.limit = 'foo';
      req.query.offset = 'bar';
      target.collection(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
    });

    it('should call micro client with request query string data', function(){
      var actionStub = sinon.stub(clientStub, 'list').resolves({payload:[]});
      req.query.unread = true;
      target.collection(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({
        limit: 10, offset: 0, unread: true
      });
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
      target.collection(metadata.v1.task)(req, res, next);
    });

    it('should execute next handler', function(done){
      var task = { id: '1', userId: '99', active: true };
      var model = Model(config, metadata.v1.task)(task);
      sinon.stub(clientStub, 'list').resolves({payload: [task]});
      // TODO: use sinon chai and spy
      var spy = done;
      target.collection(metadata.v1.task)(req, res, spy);
    });

    describe('excluding query string parameters from payload', function(){
      it('should call micro client without token', function(){
        var actionStub = sinon.stub(clientStub, 'list').resolves({payload:[]});
        req.query.token = 'secretToken';
        target.collection(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
      });

      it('should call micro client without access_token', function(){
        var actionStub = sinon.stub(clientStub, 'list').resolves({payload:[]});
        req.query.access_token = 'secretToken';
        target.collection(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
      });

      it('should call micro client without excluded query string params',
      function(){
        config.runtimeConfig.excludeQueryString = 'other';
        target = require('../lib/handlers')(config);
        var actionStub = sinon.stub(clientStub, 'list').resolves({payload:[]});
        req.query.other = 'other';
        target.collection(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
      });
    });

    describe('forwarding claims when configured', function(){
      var actionStub;
      beforeEach(function(){
        config.runtimeConfig.claims = 'userId,tenantId';
        target = require('../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'list').resolves({payload:[]});
        req.user = { userId: '1', tenantId: '1' };
      });

      it('should call micro client with claims on headers', function(){
        target.collection(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ userId: '1', tenantId: '1' })
        );
      });

      it('should call micro client with request id on headers', function(){
        target.collection(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ 'X-REQUEST-ID': '1' })
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
        target.collection(metadata.v1.task)(req, res, next);
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
        target.collection(metadata.v1.task)(req, res, next);
      });

      it('should execute next handler', function(done){
        // TODO: use sinon chai and spy
        var spy = done;
        target.collection(metadata.v1.task)(req, res, spy);
      });
    });
  });

  describe('#getResource', function(){
    var task;

    beforeEach(function(){
      task = { id: '1', userId: '99', active: true };
    });

    afterEach(function(){
      clientStub.get.restore();
    });

    it('should call micro client get action', function(){
      var actionStub = sinon.stub(clientStub, 'get')
        .resolves({payload: task});
      target.getResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request id parameter', function(){
      var actionStub = sinon.stub(clientStub, 'get')
        .resolves({payload: task});
      req.params.id = '1';
      target.getResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({id:'1'});
    });

    describe('when metadata with current user', function () {
      it('should call micro client with current user key', function(){
        var user = { id: '1', name: 'something' };
        var actionStub = sinon.stub(clientStub, 'get')
          .resolves({payload: user});
        req.user = { userId: '1' };
        target.getResource(metadata.v1.me)(req, res, next);
        actionStub.should.have.been.calledWith({id:'1'});
      });
    });

    it('should set json response on successfull call', function(done){
      var model = Model(config, metadata.v1.task)(task);
      sinon.stub(clientStub, 'get').resolves({payload: task});
      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal(model);
        done();
      };
      target.getResource(metadata.v1.task)(req, res, next);
    });

    it('should execute next handler', function(done){
      var model = Model(config, metadata.v1.task)(task);
      sinon.stub(clientStub, 'get').resolves({payload: task});
      // TODO: use sinon chai and spy
      var spy = done;
      target.getResource(metadata.v1.task)(req, res, spy);
    });

    describe('forwarding claims when configured', function(){
      var actionStub;

      beforeEach(function(){
        config.runtimeConfig.claims = 'userId,tenantId';
        target = require('../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'get')
          .resolves({payload: task});
        req.user = { userId: '1', tenantId: '1' };
      });

      it('should call micro client with claims on headers', function(){
        target.getResource(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ userId: '1', tenantId: '1' })
        );
      });

      it('should call micro client with request id on headers', function(){
        target.getResource(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ 'X-REQUEST-ID': '1' })
        );
      });
    });

    describe('on micro client error', function(){
      beforeEach(function () {
        actionStub = sinon.stub(clientStub, 'get').rejects(error);
      });

      it('should set status with error code', function(done){
        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.getResource(metadata.v1.task)(req, res, next);
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
        target.getResource(metadata.v1.task)(req, res, next);
      });

      it('should execute next handler', function(done){
        // TODO: use sinon chai and spy
        var spy = done;
        target.getResource(metadata.v1.task)(req, res, spy);
      });
    });
  });

  describe('#createResource', function(){
    var task;

    beforeEach(function(){
      task = { id: '1', userId: '99', active: true };
    });

    afterEach(function(){
      clientStub.create.restore();
    });

    it('should call micro client create action', function(){
      var actionStub = sinon.stub(clientStub, 'create')
        .resolves({payload: task});
      target.createResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request model data', function(){
      var actionStub = sinon.stub(clientStub, 'create')
        .resolves({payload: task});
      req.body = { userId: '99', active: true };
      target.createResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({ userId: '99', active: true });
    });

    it('should call micro client with request model data excluding non model data', function(){
      var actionStub = sinon.stub(clientStub, 'create')
        .resolves({payload: task});
      req.body = { userId: '99', active: true, something: true };
      target.createResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({ userId: '99', active: true });
    });

    it('should set json response on successfull call', function(done){
      var model = Model(config, metadata.v1.task)(task);
      sinon.stub(clientStub, 'create').resolves({payload: task});
      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal(model);
        done();
      };
      target.createResource(metadata.v1.task)(req, res, next);
    });

    it('should execute next handler', function(done){
      var model = Model(config, metadata.v1.task)(task);
      sinon.stub(clientStub, 'create').resolves({payload: task});
      // TODO: use sinon chai and spy
      var spy = done;
      target.createResource(metadata.v1.task)(req, res, spy);
    });

    describe('forwarding claims when configured', function(){
      var actionStub;

      beforeEach(function(){
        config.runtimeConfig.claims = 'userId,tenantId';
        target = require('../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'create')
          .resolves({payload: task});
        req.user = { userId: '1', tenantId: '1' };
      });

      it('should call micro client with claims on headers', function(){
        target.createResource(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ userId: '1', tenantId: '1' })
        );
      });

      it('should call micro client with request id on headers', function(){
        target.createResource(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ 'X-REQUEST-ID': '1' })
        );
      });
    });

    describe('on micro client error', function(){
      beforeEach(function () {
        actionStub = sinon.stub(clientStub, 'create').rejects(error);
      });

      it('should set status with error code', function(done){
        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.createResource(metadata.v1.task)(req, res, next);
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
        target.createResource(metadata.v1.task)(req, res, next);
      });

      it('should execute next handler', function(done){
        // TODO: use sinon chai and spy
        var spy = done;
        target.createResource(metadata.v1.task)(req, res, spy);
      });
    });
  });

  describe('#updateResource', function(){
    var task;

    beforeEach(function(){
      task = { id: '1', userId: '99', active: true };
    });

    afterEach(function(){
      clientStub.update.restore();
    });

    it('should call micro client update action', function(){
      var actionStub = sinon.stub(clientStub, 'update')
        .resolves({payload: task});
      target.updateResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request model data', function(){
      var actionStub = sinon.stub(clientStub, 'update')
        .resolves({payload: task});
      req.params.id = '1';
      req.body = { userId: '99', active: true };
      target.updateResource(metadata.v1.task)(req, res, next);
      var expected = { id: '1', userId: '99', active: true };
      actionStub.should.have.been.calledWith(expected);
    });

    it('should call micro client with id from resource path', function(){
      var actionStub = sinon.stub(clientStub, 'update')
        .resolves({payload: task});
      req.params.id = '1';
      req.body = { id: '2', userId: '99', active: true };
      target.updateResource(metadata.v1.task)(req, res, next);
      var expected = { id: '1', userId: '99', active: true };
      actionStub.should.have.been.calledWith(expected);
    });

    it('should call micro client with request model data excluding non model data', function(){
      var actionStub = sinon.stub(clientStub, 'update')
        .resolves({payload: task});
      req.params.id = '1';
      req.body = { userId: '99', active: true, something: true };
      target.updateResource(metadata.v1.task)(req, res, next);
      var expected = { id: '1', userId: '99', active: true };
      actionStub.should.have.been.calledWith(expected);
    });

    it('should set json response on successfull call', function(done){
      var model = Model(config, metadata.v1.task)(task);
      sinon.stub(clientStub, 'update').resolves({payload: task});
      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal(model);
        done();
      };
      target.updateResource(metadata.v1.task)(req, res, next);
    });

    it('should execute next handler', function(done){
      var model = Model(config, metadata.v1.task)(task);
      sinon.stub(clientStub, 'update').resolves({payload: task});
      // TODO: use sinon chai and spy
      var spy = done;
      target.updateResource(metadata.v1.task)(req, res, spy);
    });

    describe('forwarding claims when configured', function(){
      var actionStub;

      beforeEach(function(){
        config.runtimeConfig.claims = 'userId,tenantId';
        target = require('../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'update')
          .resolves({payload: task});
        req.user = { userId: '1', tenantId: '1' };
      });

      it('should call micro client with claims on headers', function(){
        target.updateResource(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ userId: '1', tenantId: '1' })
        );
      });

      it('should call micro client with request id on headers', function(){
        target.updateResource(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ 'X-REQUEST-ID': '1' })
        );
      });
    });

    describe('on micro client error', function(){
      beforeEach(function () {
        actionStub = sinon.stub(clientStub, 'update').rejects(error);
      });

      it('should set status with error code', function(done){
        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.updateResource(metadata.v1.task)(req, res, next);
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
        target.updateResource(metadata.v1.task)(req, res, next);
      });

      it('should execute next handler', function(done){
        // TODO: use sinon chai and spy
        var spy = done;
        target.updateResource(metadata.v1.task)(req, res, spy);
      });
    });
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
        config.runtimeConfig.claims = 'userId,tenantId';
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
      clientStub.count.restore();
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
        config.runtimeConfig.claims = 'userId,tenantId';
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
        config.runtimeConfig.excludeQueryString = 'other';
        target = require('../lib/handlers')(config);
        var actionStub = sinon.stub(clientStub, 'list')
                .resolves({payload: []});
        req.query.other = 'other';
        target.collection(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
      });
    });

    describe('forwarding claims when configured', function(){
      var actionStub;

      beforeEach(function(){
        config.runtimeConfig.claims = 'userId,tenantId';
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
        config.runtimeConfig.claims = 'userId,tenantId';
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
