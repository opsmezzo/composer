
var composer = require('../../lib/composer');

var assert = module.exports = require('assert');

assert.systems = {};

assert.systems.ubuntuBase = function (system) {
  assert.instanceOf(system, composer.resources.System);
  assert.lengthOf(system.files, 2);
  assert.lengthOf(system.scripts, 1);
};
