var chai = require('chai'),
    should = chai.should(),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    clientHelper = require('../support/client_helper'),
    stubs = require('../stubs/index'),
    Model = require('../../lib/model'),
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
    metadata = require('../metadata/index');
    config = {
      runtimeConfig: {
        baseUrl: 'http://test',
        documentationUrl: 'http://test#docs',
        excludeQueryString: ['token', 'access_token']
      },
      metadata: metadata
    };
    target = require('../../lib/handlers')(config);
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

  describe('#resourceRelation', function(){
    afterEach(function(){
      clientStub.list.restore();
    });

    it('should call micro client list action', function(){
      var actionStub = sinon.stub(clientStub, 'list')
        .resolves({payload: []});
      target.resourceRelation(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.called; // jshint ignore:line
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
      };
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
        target = require('../../lib/handlers')(config);
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
      });

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
        actionStub.should.have.been.calledWith({offset: 0, limit: 10, userId: '99'});
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
        target = require('../../lib/handlers')(config);
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
        };
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
});
