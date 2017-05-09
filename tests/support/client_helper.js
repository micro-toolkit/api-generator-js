var sinon = require('sinon'),
    Q = require('q'),
    sinonAsPromised = require('sinon-as-promised'),
    client = require('../../lib/client');

sinonAsPromised(Q.promise);

var nop = function(){};

function init(){
  var clientStub = {
    call: nop,
    get: nop,
    list: nop,
    create: nop,
    update: nop,
    remove: nop,
    count: nop,
    batch: nop
  };
  sinon.stub(client, 'init').returns(clientStub);
  return clientStub;
}

function restore(){
  client.init.restore();
}

module.exports = {
  init: init,
  restore: restore
};
