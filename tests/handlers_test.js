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
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
      target.collection(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with limit and offset defaults', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
      target.collection(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
    });

    it('should call micro client with request limit and offset', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
      req.query.limit = 2;
      req.query.offset = 1;
      target.collection(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({ limit: 2, offset: 1 });
    });

    it('should call micro client with request query string data', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
      req.query.unread = true;
      target.collection(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({
        limit: 10, offset: 0, unread: true
      });
    });

    it('should set json response on successfull call', function(done){
      var task = { id: '1', userId: '99', active: true };
      var model = Model(config, metadata.v1.task)(task);
      var stub = sinon.stub().resolves([task]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
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
      var stub = sinon.stub().resolves([task]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
      // TODO: use sinon chai and spy
      var spy = done;
      target.collection(metadata.v1.task)(req, res, spy);
    });

    describe('excluding query string parameters from payload', function(){
      it('should call micro client without token', function(){
        var stub = sinon.stub().resolves([]);
        var actionStub = sinon.stub(clientStub, 'list').returns(stub());
        req.query.token = 'secretToken';
        target.collection(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
      });

      it('should call micro client without excluded query string params',
      function(){
        config.runtimeConfig.excludeQueryString = 'other';
        target = require('../lib/handlers')(config);
        var stub = sinon.stub().resolves([]);
        var actionStub = sinon.stub(clientStub, 'list').returns(stub());
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
        actionStub = sinon.stub(clientStub, 'list').resolves();
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
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'get').returns(stub());
      target.getResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request id parameter', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'get').returns(stub());
      req.params.id = '1';
      target.getResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({id:'1'});
    });

    it('should set json response on successfull call', function(done){
      var model = Model(config, metadata.v1.task)(task);
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'get').returns(stub());
      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal(model);
        done();
      };
      target.getResource(metadata.v1.task)(req, res, next);
    });

    it('should execute next handler', function(done){
      var model = Model(config, metadata.v1.task)(task);
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'get').returns(stub());
      // TODO: use sinon chai and spy
      var spy = done;
      target.getResource(metadata.v1.task)(req, res, spy);
    });

    describe('forwarding claims when configured', function(){
      var actionStub;

      beforeEach(function(){
        config.runtimeConfig.claims = 'userId,tenantId';
        target = require('../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'get').resolves(task);
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
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'create').returns(stub());
      target.createResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request model data', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'create').returns(stub());
      req.body = { userId: '99', active: true };
      target.createResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({ userId: '99', active: true });
    });

    it('should call micro client with request model data excluding non model data', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'create').returns(stub());
      req.body = { userId: '99', active: true, something: true };
      target.createResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({ userId: '99', active: true });
    });

    it('should set json response on successfull call', function(done){
      var model = Model(config, metadata.v1.task)(task);
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'create').returns(stub());
      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal(model);
        done();
      };
      target.createResource(metadata.v1.task)(req, res, next);
    });

    it('should execute next handler', function(done){
      var model = Model(config, metadata.v1.task)(task);
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'create').returns(stub());
      // TODO: use sinon chai and spy
      var spy = done;
      target.createResource(metadata.v1.task)(req, res, spy);
    });

    describe('forwarding claims when configured', function(){
      var actionStub;

      beforeEach(function(){
        config.runtimeConfig.claims = 'userId,tenantId';
        target = require('../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'create').resolves(task);
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
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'update').returns(stub());
      target.updateResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request model data', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'update').returns(stub());
      req.params.id = '1';
      req.body = { userId: '99', active: true };
      target.updateResource(metadata.v1.task)(req, res, next);
      var expected = { id: '1', userId: '99', active: true };
      actionStub.should.have.been.calledWith(expected);
    });

    it('should call micro client with id from resource path', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'update').returns(stub());
      req.params.id = '1';
      req.body = { id: '2', userId: '99', active: true };
      target.updateResource(metadata.v1.task)(req, res, next);
      var expected = { id: '1', userId: '99', active: true };
      actionStub.should.have.been.calledWith(expected);
    });

    it('should call micro client with request model data excluding non model data', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'update').returns(stub());
      req.params.id = '1';
      req.body = { userId: '99', active: true, something: true };
      target.updateResource(metadata.v1.task)(req, res, next);
      var expected = { id: '1', userId: '99', active: true };
      actionStub.should.have.been.calledWith(expected);
    });

    it('should set json response on successfull call', function(done){
      var model = Model(config, metadata.v1.task)(task);
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'update').returns(stub());
      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal(model);
        done();
      };
      target.updateResource(metadata.v1.task)(req, res, next);
    });

    it('should execute next handler', function(done){
      var model = Model(config, metadata.v1.task)(task);
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'update').returns(stub());
      // TODO: use sinon chai and spy
      var spy = done;
      target.updateResource(metadata.v1.task)(req, res, spy);
    });

    describe('forwarding claims when configured', function(){
      var actionStub;

      beforeEach(function(){
        config.runtimeConfig.claims = 'userId,tenantId';
        target = require('../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'update').resolves(task);
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
      var stub = sinon.stub().resolves();
      var actionStub = sinon.stub(clientStub, 'remove').returns(stub());
      target.removeResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request id parameter', function(){
      var stub = sinon.stub().resolves();
      var actionStub = sinon.stub(clientStub, 'remove').returns(stub());
      req.params.id = '1';
      target.removeResource(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({id:'1'});
    });

    it('should call json response on successfull call', function(done){
      var stub = sinon.stub().resolves();
      var actionStub = sinon.stub(clientStub, 'remove').returns(stub());
      // TODO: this isnt working with spy.should.have.been.called
      res.json = done;
      target.removeResource(metadata.v1.task)(req, res, next);
    });

    it('should execute next handler', function(done){
      var stub = sinon.stub().resolves();
      var actionStub = sinon.stub(clientStub, 'remove').returns(stub());
      // TODO: use sinon chai and spy
      var spy = done;
      target.removeResource(metadata.v1.task)(req, res, spy);
    });

    describe('forwarding claims when configured', function(){
      var actionStub;

      beforeEach(function(){
        config.runtimeConfig.claims = 'userId,tenantId';
        target = require('../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'remove').resolves();
        req.user = { userId: '1', tenantId: '1' };
      });

      it('should call micro client with claims on headers', function(){
        var stub = sinon.stub().resolves();
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

  describe('#resourceRelation', function(){
    afterEach(function(){
      clientStub.list.restore();
    });

    it('should call micro client list action', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should call micro client with resource foreign key', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
      req.params.id = '1';
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.calledWith(sinon.match({ userId: '1' }));
    });

    it('should call micro client with limit and offset defaults', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.calledWith(sinon.match({ limit: 10, offset: 0 }));
    });

    it('should call micro client with request limit and offset', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
      req.query.limit = 2;
      req.query.offset = 1;
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.calledWith(
        sinon.match({ limit: 2, offset: 1 }));
    });

    it('should call micro client with request query string data', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
      req.query.unread = true;
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.calledWith(sinon.match({ unread: true }));
    });

    it('should set json response on successfull call', function(done){
      var task = { id: '1', userId: '99', active: true };
      var model = Model(config, metadata.v1.task)(task);
      var stub = sinon.stub().resolves([task]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
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
      var stub = sinon.stub().resolves([task]);
      var actionStub = sinon.stub(clientStub, 'list').returns(stub());
      // TODO: use sinon chai and spy
      var spy = done;
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, spy);
    });

    describe('excluding query string parameters from payload', function(){
      it('should call micro client without token', function(){
        var stub = sinon.stub().resolves([]);
        var actionStub = sinon.stub(clientStub, 'list').returns(stub());
        req.query.token = 'secretToken';
        target.collection(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
      });

      it('should call micro client without excluded query string params',
      function(){
        config.runtimeConfig.excludeQueryString = 'other';
        target = require('../lib/handlers')(config);
        var stub = sinon.stub().resolves([]);
        var actionStub = sinon.stub(clientStub, 'list').returns(stub());
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
        actionStub = sinon.stub(clientStub, 'list').resolves([]);
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
      var stub = sinon.stub().resolves();
      var actionStub = sinon.stub(clientStub, 'call')
        .withArgs('activate', {id:'1'})
        .returns(stub());

      var action = metadata.v1.user.actions[1];
      target.nonStandardAction(metadata.v1.user, action)(req, res, next);
      actionStub.should.have.been.called;
    });

    it('should set json response on successfull call', function(done){
      var model = Model(config, metadata.v1.user)(stubs.user);
      var stub = sinon.stub().resolves(stubs.user);
      var actionStub = sinon.stub(clientStub, 'call')
        .withArgs('activate', {id:'1'})
        .returns(stub());

      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal(model);
        done();
      };
      var action = metadata.v1.user.actions[1];
      target.nonStandardAction(metadata.v1.user, action)(req, res, next);
    });

    it('should set a empty json response on delete call', function(done){
      var stub = sinon.stub().resolves();
      var actionStub = sinon.stub(clientStub, 'call')
        .withArgs('deactivate', {id:'1'})
        .returns(stub());

      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        should.not.exist(data);
        done();
      };
      var action = metadata.v1.user.actions[2];
      target.nonStandardAction(metadata.v1.user, action)(req, res, next);
    });

    it('should execute next handler', function(done){
      var stub = sinon.stub().resolves();
      var actionStub = sinon.stub(clientStub, 'call')
        .withArgs('deactivate', {id:'1'})
        .returns(stub());
      var action = metadata.v1.user.actions[2];

      // TODO: use sinon chai and spy
      var spy = done;
      target.nonStandardAction(metadata.v1.user, action)(req, res, spy);
    });

    describe('forwarding claims when configured', function(){
      var actionStub, action;

      beforeEach(function(){
        config.runtimeConfig.claims = 'userId,tenantId';
        target = require('../lib/handlers')(config);
        req.user = { userId: '1', tenantId: '1' };
        actionStub = sinon.stub(clientStub, 'call')
          .withArgs('activate')
          .resolves();

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
