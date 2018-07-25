var target = require('../../lib/handlers/enforce_number');

describe('Helper enforceNumber', function () {
  it('should return a object', function () {
    target({limit: 1, offset: 0}, 'limit', 'offset')
      .should.be.eql({limit: 1, offset: 0});
  });

  it('should exclude a NaN parameter', function () {
    target({limit: NaN}, 'limit')
      .should.be.eql({});
  });

  it('should exclude a non numerical parameter', function () {
    target({limit: 'abc'}, 'limit')
      .should.be.eql({});
  });
});
