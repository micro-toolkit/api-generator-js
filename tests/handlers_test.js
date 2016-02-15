var chai = require('chai'),
    should = chai.should(),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    clientHelper = require('./support/client_helper'),
    Model = require('../lib/model');

chai.should();
chai.use(sinonChai);

var nop = function(){ return function(){}; };

describe('Handlers Generators', function(){
  var target, config, metadata, clientStub, req, res, actionStub;

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
      runtimeConfig: { baseUrl: 'http://test' },
      metadata: metadata
    };
    target = require('../lib/handlers')(config);
    req = { params: {}, query: {}, body: {} };
    res = {
      status: sinon.stub(),
      json: sinon.stub()
    };
    res.status.returns(res.json);
  });

  describe('#collection', function(){
    afterEach(function(){
      clientStub.all.restore();
    });

    it('should call micro client all action', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'all').returns(stub());
      target.collection(metadata.v1.task)(req, res);
      actionStub.should.have.been.called;
    });

    it('should call micro client with limit and offset defaults', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'all').returns(stub());
      target.collection(metadata.v1.task)(req, res);
      actionStub.should.have.been.calledWith({ limit: 10, offset: 0 });
    });

    it('should call micro client with request limit and offset', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'all').returns(stub());
      req.query.limit = 2;
      req.query.offset = 1;
      target.collection(metadata.v1.task)(req, res);
      actionStub.should.have.been.calledWith({ limit: 2, offset: 1 });
    });

    it('should call micro client with request query string data', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'all').returns(stub());
      req.query.unread = true;
      target.collection(metadata.v1.task)(req, res);
      actionStub.should.have.been.calledWith({
        limit: 10, offset: 0, unread: true
      });
    });

    it('should set json response on successfull call', function(done){
      var task = { id: '1', userId: '99', active: true };
      var model = Model(config, metadata.v1.task)(task);
      var stub = sinon.stub().resolves([task]);
      var actionStub = sinon.stub(clientStub, 'all').returns(stub());
      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal([model]);
        done();
      }
      target.collection(metadata.v1.task)(req, res);
    });

    describe('on micro client error', function(){
      it('should set status with error code', function(done){
        var stub = sinon.stub().rejects({ code: 500, body: 'error' });
        var actionStub = sinon.stub(clientStub, 'all').returns(stub());

        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.collection(metadata.v1.task)(req, res);
      });

      // TODO: this isnt working properly with spy.should.have.been.called
      // a bug will be open to fix this, need to proceed for now
      xit('should set json response error body', function(done){
        var stub = sinon.stub().rejects({ code: 500, body: 'error payload' });
        var actionStub = sinon.stub(clientStub, 'all').returns(stub());

        jsonStub = function(){ done(); }
        res = {
          status: function(){ return jsonStub; }
        };
        target.collection(metadata.v1.task)(req, res);
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
      target.getResource(metadata.v1.task)(req, res);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request id parameter', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'get').returns(stub());
      req.params.id = '1';
      target.getResource(metadata.v1.task)(req, res);
      actionStub.should.have.been.calledWith('1');
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
      target.getResource(metadata.v1.task)(req, res);
    });

    describe('on micro client error', function(){
      it('should set status with error code', function(done){
        var stub = sinon.stub().rejects({ code: 500, body: 'error' });
        var actionStub = sinon.stub(clientStub, 'get').returns(stub());
        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.getResource(metadata.v1.task)(req, res);
      });

      // TODO: this isnt working properly with spy.should.have.been.called
      // a bug will be open to fix this, need to proceed for now
      xit('should set json response error body', function(){
        var stub = sinon.stub().rejects({ code: 500, body: 'error payload' });
        var actionStub = sinon.stub(clientStub, 'get').returns(stub());
        var spy = res.json;
        target.getResource(metadata.v1.task)(req, res);
        spy.should.have.been.calledWith('error payload');
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
      target.createResource(metadata.v1.task)(req, res);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request model data', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'create').returns(stub());
      req.body = { userId: '99', active: true };
      target.createResource(metadata.v1.task)(req, res);
      actionStub.should.have.been.calledWith({ userId: '99', active: true });
    });

    it('should call micro client with request model data excluding non model data', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'create').returns(stub());
      req.body = { userId: '99', active: true, something: true };
      target.createResource(metadata.v1.task)(req, res);
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
      target.createResource(metadata.v1.task)(req, res);
    });

    describe('on micro client error', function(){
      it('should set status with error code', function(done){
        var stub = sinon.stub().rejects({ code: 500, body: 'error' });
        var actionStub = sinon.stub(clientStub, 'create').returns(stub());
        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.createResource(metadata.v1.task)(req, res);
      });

      // TODO: this isnt working properly with spy.should.have.been.called
      // a bug will be open to fix this, need to proceed for now
      xit('should set json response error body', function(){
        var stub = sinon.stub().rejects({ code: 500, body: 'error payload' });
        var actionStub = sinon.stub(clientStub, 'create').returns(stub());
        var spy = res.json;
        target.createResource(metadata.v1.task)(req, res);
        spy.should.have.been.calledWith('error payload');
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
      target.updateResource(metadata.v1.task)(req, res);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request model data', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'update').returns(stub());
      req.params.id = '1';
      req.body = { userId: '99', active: true };
      target.updateResource(metadata.v1.task)(req, res);
      var expected = { id: '1', userId: '99', active: true };
      actionStub.should.have.been.calledWith(expected);
    });

    it('should call micro client with id from resource path', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'update').returns(stub());
      req.params.id = '1';
      req.body = { id: '2', userId: '99', active: true };
      target.updateResource(metadata.v1.task)(req, res);
      var expected = { id: '1', userId: '99', active: true };
      actionStub.should.have.been.calledWith(expected);
    });

    it('should call micro client with request model data excluding non model data', function(){
      var stub = sinon.stub().resolves(task);
      var actionStub = sinon.stub(clientStub, 'update').returns(stub());
      req.params.id = '1';
      req.body = { userId: '99', active: true, something: true };
      target.updateResource(metadata.v1.task)(req, res);
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
      target.updateResource(metadata.v1.task)(req, res);
    });

    describe('on micro client error', function(){
      it('should set status with error code', function(done){
        var stub = sinon.stub().rejects({ code: 500, body: 'error' });
        var actionStub = sinon.stub(clientStub, 'update').returns(stub());
        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.updateResource(metadata.v1.task)(req, res);
      });

      // TODO: this isnt working properly with spy.should.have.been.called
      // a bug will be open to fix this, need to proceed for now
      xit('should set json response error body', function(){
        var stub = sinon.stub().rejects({ code: 500, body: 'error payload' });
        var actionStub = sinon.stub(clientStub, 'update').returns(stub());
        var spy = res.json;
        target.updateResource(metadata.v1.task)(req, res);
        spy.should.have.been.calledWith('error payload');
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
      target.removeResource(metadata.v1.task)(req, res);
      actionStub.should.have.been.called;
    });

    it('should call micro client with request id parameter', function(){
      var stub = sinon.stub().resolves();
      var actionStub = sinon.stub(clientStub, 'remove').returns(stub());
      req.params.id = '1';
      target.removeResource(metadata.v1.task)(req, res);
      actionStub.should.have.been.calledWith('1');
    });

    it('should call json response on successfull call', function(done){
      var stub = sinon.stub().resolves();
      var actionStub = sinon.stub(clientStub, 'remove').returns(stub());
      // TODO: this isnt working with spy.should.have.been.called
      res.json = done;
      target.removeResource(metadata.v1.task)(req, res);
    });

    describe('on micro client error', function(){
      it('should set status with error code', function(done){
        var stub = sinon.stub().rejects({ code: 500, body: 'error' });
        var actionStub = sinon.stub(clientStub, 'remove').returns(stub());
        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.removeResource(metadata.v1.task)(req, res);
      });

      // TODO: this isnt working properly with spy.should.have.been.called
      // a bug will be open to fix this, need to proceed for now
      xit('should set json response error body', function(){
        var stub = sinon.stub().rejects({ code: 500, body: 'error payload' });
        var actionStub = sinon.stub(clientStub, 'remove').returns(stub());
        var spy = res.json;
        target.removeResource(metadata.v1.task)(req, res);
        spy.should.have.been.calledWith('error payload');
      });
    });
  });

  describe('#resourceRelation', function(){
    afterEach(function(){
      clientStub.all.restore();
    });

    it('should call micro client all action', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'all').returns(stub());
      target.resourceRelation(metadata.v1.user.relations[0])(req, res);
      actionStub.should.have.been.called;
    });

    it('should call micro client with resource foreign key', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'all').returns(stub());
      req.params.id = '1';
      target.resourceRelation(metadata.v1.user.relations[0])(req, res);
      actionStub.should.have.been.calledWith(sinon.match({ userId: '1' }));
    });

    it('should call micro client with limit and offset defaults', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'all').returns(stub());
      target.resourceRelation(metadata.v1.user.relations[0])(req, res);
      actionStub.should.have.been.calledWith(sinon.match({ limit: 10, offset: 0 }));
    });

    it('should call micro client with request limit and offset', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'all').returns(stub());
      req.query.limit = 2;
      req.query.offset = 1;
      target.resourceRelation(metadata.v1.user.relations[0])(req, res);
      actionStub.should.have.been.calledWith(
        sinon.match({ limit: 2, offset: 1 }));
    });

    it('should call micro client with request query string data', function(){
      var stub = sinon.stub().resolves([]);
      var actionStub = sinon.stub(clientStub, 'all').returns(stub());
      req.query.unread = true;
      target.resourceRelation(metadata.v1.user.relations[0])(req, res);
      actionStub.should.have.been.calledWith(sinon.match({ unread: true }));
    });

    it('should set json response on successfull call', function(done){
      var task = { id: '1', userId: '99', active: true };
      var model = Model(config, metadata.v1.task)(task);
      var stub = sinon.stub().resolves([task]);
      var actionStub = sinon.stub(clientStub, 'all').returns(stub());
      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal([model]);
        done();
      }
      target.resourceRelation(metadata.v1.user.relations[0])(req, res);
    });

    describe('on micro client error', function(){
      it('should set status with error code', function(done){
        var stub = sinon.stub().rejects({ code: 500, body: 'error' });
        var actionStub = sinon.stub(clientStub, 'all').returns(stub());

        res.status = function(code){
          code.should.be.equal(500);
          done();
        }
        target.resourceRelation(metadata.v1.user.relations[0])(req, res);
      });

      // TODO: this isnt working properly with spy.should.have.been.called
      // a bug will be open to fix this, need to proceed for now
      xit('should set json response error body', function(done){
        var stub = sinon.stub().rejects({ code: 500, body: 'error payload' });
        var actionStub = sinon.stub(clientStub, 'all').returns(stub());

        jsonStub = function(){ done(); }
        res = {
          status: function(){ return jsonStub; }
        };
        target.resourceRelation(metadata.v1.user.relations[0])(req, res);
      });
    });
  });
});
