var chai = require('chai');
    should = chai.should();

describe('model', function(){
  var target, config, metadata;

  beforeEach(function(){
    metadata = require('./metadata/index');
    config = {
      runtimeConfig: { baseUrl: 'http://test' },
      metadata: metadata
    };
    target = require('../lib/model')(config, metadata.v1.user);
  });

  it('should set model properties', function(){
    var actual = target({ id: '1', name: 'Peter'});
    actual.should.have.property('id', '1');
    actual.should.have.property('name', 'Peter');
  });

  it('should set whitelisted properties only', function(){
    var actual = target({ id: '1', something: 'option'});
    actual.should.not.have.property('something');
  });

  it('should set defaults on unexistent properties', function(){
    target({ id: '1' }).should.have.property('name', null);
  });

  describe('links', function(){
    it('should set self link', function(){
      var actual = target({ id: '1', name: 'Peter'});
      actual.should.have.property('_links');
      actual._links.should.have.property('self', 'http://test/v1/users/1');
    });

    it('should set resource relation link', function(){
      target = require('../lib/model')(config, metadata.v1.task);
      var actual = target({ id: '2', userId: '1' });
      actual.should.have.property('_links');
      actual._links.should.have.property('user', 'http://test/v1/users/1');
    });

    it('should set collection relation link', function(){
      var actual = target({ id: '1', name: 'Peter'});
      actual.should.have.property('_links');
      actual._links.should.have.property('tasks', 'http://test/v1/users/1/tasks');
    });

    describe('for subresource models', function(){
      beforeEach(function () {
        target = require('../lib/model')(config, metadata.v1.role);
      });

      it('should set self link', function(){
        var actual = target({ id: '1', name: 'Admin', userId: 'pjanuario'});
        actual.should.have.property('_links');
        actual._links.should.have.property('self', 'http://test/v1/users/pjanuario/roles/1');
      });

      describe('which dont have a get action', function () {
        it('should not set self link', function () {
          var targetWithoutSelf = require('../lib/model')(config, metadata.v1.tag);
          var actual = targetWithoutSelf({id: 'red', userId: '1'});
          actual.should.have.property('_links');
          actual._links.should.have.property('self', null);
        });
      });

      it('should set resource relation link', function(){
        var actual = target({ id: '1', name: 'Admin', userId: 'pjanuario'});
        actual.should.have.property('_links');
        actual._links.should.have.property('user', 'http://test/v1/users/pjanuario');
      });
    });
  });
});
