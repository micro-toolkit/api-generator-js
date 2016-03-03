var target = require('../lib/error_helper');

describe('Error helper', function () {
  var config, error;

  beforeEach(function () {
    config = { documentationUrl: 'http://url#errors' };
    error = {
      code: 500,
      userMessage: 'user',
      developerMessage: 'dev'
    };
  });

  it('should return a valid error format', function () {
    var actual = target.getError(config, error);
    actual.should.have.property('code');
    actual.should.have.property('userMessage');
    actual.should.have.property('developerMessage');
    actual.should.have.property('validationErrors');
    actual.should.have.property('documentationUrl');
  });

  it('should return a api error', function () {
    var actual = target.getError(config, error);
    actual.should.have.property('code', 'api_error');
  });

  it('should return a invalid request error', function () {
    error.code = 400;
    var actual = target.getError(config, error);
    actual.should.have.property('code', 'invalid_request_error');
  });

  it('should return a error with validation messages', function () {
    error.code = 400;
    error.validationErrors = ['something']
    var actual = target.getError(config, error);
    actual.validationErrors.should.be.eql(['something']);
  });
});
