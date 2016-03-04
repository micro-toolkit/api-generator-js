function getErrorType(errorCode) {
  return parseInt(errorCode / 100, 10);
}

function getCode(error) {
  var errorType = getErrorType(error.code);
  if (errorType === 4) { return 'invalid_request_error'; }
  return 'api_error';
}

function getError(config, error){
  return {
    code:             getCode(error),
    userMessage:      error.userMessage,
    developerMessage: error.developerMessage,
    validationErrors: error.validationErrors || [],
    documentationUrl: config.documentationUrl || null
  };
}

module.exports = {
  getError: getError
};
