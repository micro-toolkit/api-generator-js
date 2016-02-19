var chai = require('chai'),
    should = chai.should,
    expect = chai.expect;

chai.should();

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

});
