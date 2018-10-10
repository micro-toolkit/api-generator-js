var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    chaiAsPromised = require('chai-as-promised'),
    clientHelper = require('./support/client_helper');

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Unit | embeds', function() {
  var target, config, metadata, serviceStub, userData, taskData;

  before(function(){
    serviceStub = clientHelper.init();
  });

  after(function(){
    clientHelper.restore();
    serviceStub = null;
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
    target = require('../lib/embed');
    userData = { id: 'u1', roleId: 'r1' };
    taskData = { id: 't1', userId: 'u1' };
  });

  afterEach(function(){
    if(serviceStub.batch.restore) {
      serviceStub.batch.restore();
    }
  });

  it('should return data when is null', function() {
    var actual = target(metadata.v1.task, config, {}, null);
    expect(actual).to.eventually.be.null; // jshint ignore:line
  });

  it('should not call batch operation when data is null', function() {
    var actionStub = sinon.stub(serviceStub, 'batch')
      .rejects({
        code: 500,
        userMessage: 'user message',
        developerMessage: 'dev message'
      });

    return target(metadata.v1.task, config, {query:{embeds: 'user'}}, null)
      .then(function(){
        actionStub.should.not.have.been.called;
      });
  });

  it('should not call batch operation when data is empty array', function() {
    var actionStub = sinon.stub(serviceStub, 'batch')
      .rejects({
        code: 500,
        userMessage: 'user message',
        developerMessage: 'dev message'
      });

    return target(metadata.v1.task, config, {query:{embeds: 'user'}}, [])
      .then(function(){
        actionStub.should.not.have.been.called;
      });
  });

  it('should return data when query is null', function(){
    target(metadata.v1.task, config, {query: null}, 'abc')
      .should.eventually.be.eql('abc');
  });

  it('should return data when embeds is empty', function(){
    target(metadata.v1.task, config, {query: {embeds: ''}}, 'abc')
      .should.eventually.be.eql('abc');
  });

  it('should return data when embeds is null', function(){
    target(metadata.v1.task, config, {query: {embeds: null}}, 'abc')
      .should.eventually.be.eql('abc');
  });

  it('should set embed as null when the service fails to respond', function() {
    sinon.stub(serviceStub, 'batch')
      .withArgs({id: ['u1']})
      .rejects({
        code: 500,
        userMessage: 'user message',
        developerMessage: 'dev message'
      });

    return target(metadata.v1.task, config, {query:{ embeds: 'user'}}, taskData)
      .should.eventually.have.property('user', null);
  });

  describe('forwards claims when configured', function(){
    var actionStub, req;
    beforeEach(function(){
      config.runtimeConfig.claims = ['userId','tenantId'];
      actionStub = sinon.stub(serviceStub, 'batch')
        .resolves({payload: [{id: 'u1', data: userData}] });
      req = {
        requestId: '1',
        user: { userId: '1', tenantId: '1' },
        query: {embeds: 'user'}
      };
    });

    it('should call micro client with claims on headers', function(){
      return target(metadata.v1.task, config, req, [taskData])
        .then(function(){
          actionStub.should.have.been.calledWith(
            sinon.match.any, sinon.match({ userId: '1', tenantId: '1' })
          );
        });
    });

    it('should call micro client with request id on headers', function(){
      return target(metadata.v1.task, config, req, [taskData])
        .then(function(){
          actionStub.should.have.been.calledWith(
            sinon.match.any, sinon.match({ 'X-REQUEST-ID': '1' })
          );
        });
    });
  });

  it('should embed resource in a collection', function() {
    sinon.stub(serviceStub, 'batch')
      .withArgs({id: ['u1']})
      .resolves({payload: [{id: 'u1', data: userData}] });

    return target(metadata.v1.task, config, {query:{embeds: 'user'}}, [taskData])
      .should.eventually.have.deep.property('0.user');
  });

  it('should embed resource in a collection without null values', function() {
    sinon.stub(serviceStub, 'batch')
      .withArgs({id: ['u1']})
      .resolves({payload: [{id: 'u1', data: userData}] });

    var tasks = [taskData, { id: 't2', userId: null }];
    return target(metadata.v1.task, config, {query:{embeds: 'user'}}, tasks)
      .should.eventually.have.deep.property('1.user', null);
  });

  it('should embed resource in a resource', function() {
    sinon.stub(serviceStub, 'batch')
      .withArgs({id: ['u1']})
      .resolves({payload: [{id: 'u1', data: userData}] });

    return target(metadata.v1.task, config, {query:{embeds: 'user'}}, taskData)
      .should.eventually.have.property('user');
  });

  it('should embed a collection in a collection', function() {
    sinon.stub(serviceStub, 'batch')
      .withArgs({userId: ['u1']})
      .resolves({payload: [{userId: 'u1', data: [taskData]}] });

    return target(metadata.v1.user, config, {query:{ embeds: 'tasks'}}, [userData])
      .should.eventually.have.deep.property('0.tasks');
  });

  it('should embed a collection in a resource', function() {
    sinon.stub(serviceStub, 'batch')
      .withArgs({userId: ['u1']})
      .resolves({payload: [{userId: 'u1', data: [taskData]}] });

    return target(metadata.v1.user, config, {query:{ embeds: 'tasks'}}, userData)
      .should.eventually.have.property('tasks');
  });

  it('should have model serialized embed resource', function() {
    userData.other = true;
    sinon.stub(serviceStub, 'batch')
      .withArgs({id: ['u1']})
      .resolves({payload: [{id: 'u1', data: userData}] });

    return target(metadata.v1.task, config, {query:{embeds: 'user'}}, taskData)
      .should.eventually.not.have.deep.property('user.other');
  });

  it('should have model serialized embed collection', function() {
    taskData.other = true;
    sinon.stub(serviceStub, 'batch')
      .withArgs({userId: ['u1']})
      .resolves({payload: [{userId: 'u1', data: [taskData]}]});

    return target(metadata.v1.user, config, {query:{ embeds: 'tasks'}}, userData)
      .should.eventually.not.have.deep.property('tasks.0.other');
  });

  it('should support multiple embeds', function() {
    sinon.stub(serviceStub, 'batch')
      .withArgs({userId: ['u1']})
      .resolves({payload: [{userId: 'u1', data: [taskData]}] })
      .withArgs({id: ['r1']})
      .resolves({payload: [{id: 'r1', data: { id: 'r1' }}] });

    return target(metadata.v1.user, config, {query:{ embeds: 'tasks,role'}}, userData)
      .then(function(models) {
        models.should.have.property('tasks');
        models.should.have.property('role');
      });
  });
});
