var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect;

describe('metadata', function(){
  var target, metadata;

  beforeEach(function(){
    target = require('../lib/metadata');
  });

  describe('#load', function(){
    it('should set version property', function(){
      target('v1', 'task', {}).should.have.property('version', 'v1');
    });

    it('should set model name property', function(){
      target('v1', 'task', {}).should.have.property('modelName', 'task');
    });

    it('should set actions to empty array when unexistent', function(){
      target('v1', 'task', {}).actions.should.deep.equal([]);
    });

    it('should set relations to empty array when unexistent', function(){
      target('v1', 'task', {}).relations.should.deep.equal([]);
    });

    describe('with invalid action', function () {
      var action;
      beforeEach(function () {
        action = { httpVerb: 'put', name: 'active', verb: 'activate' };
      });

      it('should throw a error on invalid http verb', function () {
        action.httpVerb = 'invalid';
        var metadata = {actions: [action] };
        expect(function(){
          target('v1', 'task', metadata)
        }).to.throw(Error, /is invalid due to httpVerb/);
      });

      it('should throw a error on empty http verb', function () {
        action.httpVerb = '';
        var metadata = {actions: [action] };
        expect(function(){
          target('v1', 'task', metadata)
        }).to.throw(Error, /is invalid due to httpVerb/);
      });

      it('should throw a error on invalid name', function () {
        action.name = '';
        var metadata = {actions: [action] };
        expect(function(){
          target('v1', 'task', metadata)
        }).to.throw(Error, /is invalid due to name/);
      });

      it('should throw a error on invalid verb', function () {
        action.verb = '';
        var metadata = {actions: [action] };
        expect(function(){
          target('v1', 'task', metadata)
        }).to.throw(Error, /is invalid due to verb/);
      });
    });

    describe('on loading relation', function(){
      it('should set relation version', function(){
        var relation = { type: 'resource', name: 'user' };
        var metadata = { relations: [ relation ] };
        target('v1', 'task', metadata).relations[0]
          .should.have.property('version', 'v1');
      });

      it('should set relation model', function(){
        var relation = { type: 'resource', name: 'user' };
        var metadata = { relations: [ relation ] };
        target('v1', 'task', metadata).relations[0]
          .should.have.property('model', 'user');
      });

      it('should set relation model sigularized', function(){
        var relation = { type: 'collection', name: 'tasks' };
        var metadata = { relations: [ relation ] };
        target('v1', 'user', metadata).relations[0]
          .should.have.property('model', 'task');
      });

      it('should override relation model default', function(){
        var relation = { type: 'resource', name: 'owner', model: 'user' };
        var metadata = { relations: [ relation ] };
        target('v1', 'task', metadata).relations[0]
          .should.have.property('model', 'user');
      });

      it('should set relation parent', function(){
        var relation = { type: 'resource', name: 'user' };
        var metadata = { relations: [ relation ] };
        target('v1', 'task', metadata).relations[0]
          .should.have.property('parent', 'task');
      });

      it('should set relation model foreign key', function(){
        var relation = { type: 'resource', name: 'user' };
        var metadata = { relations: [ relation ] };
        target('v1', 'task', metadata).relations[0]
          .should.have.property('modelFk', 'userId');
      });

      it('should set relation foreign key for collection', function(){
        var relation = { type: 'collection', name: 'tasks' };
        var metadata = { relations: [ relation ] };
        target('v1', 'user', metadata).relations[0]
          .should.have.property('modelFk', 'userId');
      });

      it('should override relation model foreign key default', function(){
        var relation = { type: 'resource', name: 'owner', modelFk: 'userId' };
        var metadata = { relations: [ relation ] };
        target('v1', 'task', metadata).relations[0]
          .should.have.property('modelFk', 'userId');
      });
    });
  });

  describe('on loading path', function () {
    it('should set path', function () {
      should.exist(target('v1', 'task', {}).path);
    });

    it('should set path without prefix', function () {
      should.not.exist(target('v1', 'task', {}).path.prefix);
    });

    it('should set path without value', function () {
      should.not.exist(target('v1', 'task', {}).path.value);
    });

    describe('with path object', function () {
      it('should set value to null when not present', function () {
        var metadata = { path: {} };
        expect(target('v1', 'claim', metadata).path.value).to.be.equal(null);
      });

      it('should set prefix to null when not present', function () {
        var metadata = { path: {} };
        expect(target('v1', 'claim', metadata).path.prefix).to.be.equal(null);
      });

      it('should set path prefix', function () {
        var metadata = { path: { prefix: 'admin/' } };
        target('v1', 'claim', metadata).path.prefix.should.be.equal('admin/');
      });

      it('should set path value', function () {
        var metadata = { path: { value: 'me' } };
        target('v1', 'me', metadata).path.value.should.be.equal('me');
      });
    });

  });

});
