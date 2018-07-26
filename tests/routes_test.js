var chai = require('chai');
    should = chai.should();

describe('routes', function(){
  var target, metadata, config;

  beforeEach(function(){
    metadata = require('./metadata/index');
    config = {
      runtimeConfig: { baseUrl: 'http://test', metricService: {} },
      metadata: metadata
    };
    target = require('../lib/routes');
  });

  describe('#relationsRoutes', function(){
    it('should not return relation routes from same parent', function(){
      target.relationsRoutes(config, metadata.v1.computeInstance)
        .should.be.eql([])
    });
  });
});
