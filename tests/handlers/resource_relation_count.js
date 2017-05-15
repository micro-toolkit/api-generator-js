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

  describe('#resourceRelationCount', function(){
    afterEach(function(){
      if(clientStub.count.restore) { clientStub.count.restore(); }
    });

    it('should init the proper micro client', function(){
      var client = require('../../lib/client');
      var spy = client.init;
      var expected = metadata.v1.task;
      target.resourceRelationCount(metadata.v1.user.relations[0]);
      spy.should.have.been.calledWith('task', sinon.match.any);
    });

    it('should call micro client count action', function(){
      var actionStub = sinon.stub(clientStub, 'count')
        .resolves({payload: 0});
      target.resourceRelationCount(metadata.v1.user.relations[0])(req, res, next);
      actionStub.should.have.been.called; // jshint ignore:line
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
      };
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
        target = require('../../lib/handlers')(config);
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
        };
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
});
