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

  describe('#collectionCount', function(){
    afterEach(function(){
      clientStub.count.restore();
    });

    it('should call micro client count action', function(){
      var actionStub = sinon.stub(clientStub, 'count').resolves({payload:[]});
      target.collectionCount(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.called; // jshint ignore:line
    });

    it('should call micro client without limit and offset', function(){
      var actionStub = sinon.stub(clientStub, 'count').resolves({payload:[]});
      target.collectionCount(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWith({});
    });

    it('should call micro client with request query string data', function(){
      var actionStub = sinon.stub(clientStub, 'count').resolves({payload:[]});
      req.query.unread = true;
      target.collectionCount(metadata.v1.task)(req, res, next);
      actionStub.should.have.been.calledWithMatch({ unread: true });
    });

    it('should set json response on successfull call', function(done){
      sinon.stub(clientStub, 'count').resolves({payload: 1 });
      // TODO: this isnt working with spy.should.have.been.called
      res.json = function(data){
        data.should.be.deep.equal({ count: 1 });
        done();
      };
      target.collectionCount(metadata.v1.task)(req, res, next);
    });

    it('should execute next handler', function(done){
      sinon.stub(clientStub, 'count').resolves({payload: 1});
      // TODO: use sinon chai and spy
      var spy = done;
      target.collectionCount(metadata.v1.task)(req, res, spy);
    });

    describe('excluding query string parameters from payload', function(){
      it('should call micro client without token', function(){
        var actionStub = sinon.stub(clientStub, 'count').resolves({payload: 1});
        req.query.token = 'secretToken';
        target.collectionCount(metadata.v1.task)(req, res, next);
        actionStub.should.not.have.been.calledWithMatch({token: 'secretToken'});
      });

      it('should call micro client without access_token', function(){
        var actionStub = sinon.stub(clientStub, 'count').resolves({payload: 1});
        req.query.access_token = 'secretToken';
        target.collectionCount(metadata.v1.task)(req, res, next);
        actionStub.should.not.have.been.calledWithMatch({access_token: 'secretToken'});
      });

      it('should call micro client without excluded query string params',
      function(){
        config.runtimeConfig.excludeQueryString = ['other'];
        target = require('../../lib/handlers')(config);
        var actionStub = sinon.stub(clientStub, 'count').resolves({payload: 1});
        req.query.other = 'other';
        target.collectionCount(metadata.v1.task)(req, res, next);
        actionStub.should.not.have.been.calledWithMatch({other: 'other'});
      });
    });

    describe('forwarding claims when configured', function(){
      var actionStub;
      beforeEach(function(){
        config.runtimeConfig.claims = ['userId','tenantId'];
        target = require('../../lib/handlers')(config);
        actionStub = sinon.stub(clientStub, 'count').resolves({payload: 1});
        req.user = { userId: '1', tenantId: '1' };
      });

      it('should call micro client with claims on headers', function(){
        target.collectionCount(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ userId: '1', tenantId: '1' })
        );
      });

      it('should call micro client with request id on headers', function(){
        target.collectionCount(metadata.v1.task)(req, res, next);
        actionStub.should.have.been.calledWith(
          sinon.match.any, sinon.match({ 'X-REQUEST-ID': '1' })
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
        target.collectionCount(metadata.v1.task)(req, res, next);
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
        target.collectionCount(metadata.v1.task)(req, res, next);
      });

      it('should execute next handler', function(done){
        // TODO: use sinon chai and spy
        var spy = done;
        target.collectionCount(metadata.v1.task)(req, res, spy);
      });
    });
  });
});
