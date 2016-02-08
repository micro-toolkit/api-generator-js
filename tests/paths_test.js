var chai = require('chai');
    should = chai.should();

describe('paths', function(){
  var target, metadata;

  beforeEach(function(){
    metadata = require('./metadata/index');
    target = require('../lib/paths')({ metadata: metadata });
  });

  describe('#collection', function(){
    it('should return a pluralized collection path', function(){
      target.collection(metadata.task).should.be.eql('/tasks');
    });
  });

  describe('#resource', function(){
    it('should return a resource path', function(){
      target.resource(metadata.task).should.be.eql('/tasks/:id');
    });
  });

  describe('#resourceRelation', function(){
    it('should return a relation resource path', function(){
      var relation = metadata.task.relations[0];
      target.resourceRelation(relation).should.be.eql('/users/:id');
    });

    it('should return a relation collection path', function(){
      var relation = metadata.user.relations[0];
      target.resourceRelation(relation).should.be.eql('/users/:id/tasks');
    });
  });

});
