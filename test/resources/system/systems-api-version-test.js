/*
 * systems-api-version-test.js: Tests for the 'system' resource's RESTful API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    apiEasy = require('api-easy'),
    helpers = require('../../helpers'),
    fixtures = require('../../fixtures/systems'),
    systems = fixtures.systems,
    missing = fixtures.missing;
    
var testSystem = systems[0],
    fixtureOne = missing[0],
    port = 9002;
    
testSystem.version = '0.1.2';

var suite = apiEasy.describe('composer/resources/systems/api/versions').addBatch(
  helpers.macros.requireComposer(port)
);

helpers.testApi(suite, port)
  .discuss('With a new version')
  .put('/systems/test-system', testSystem)
    .expect(200)
  .next()
  .undiscuss()
  .get('/systems/test-system')
    .expect(200)
    .expect('should respond with both versions', function (err, res, body) {
      assert.isNull(err);
      
      var result = JSON.parse(body);
      assert.isObject(result.system);
      assert.isObject(result.system.versions);
      assert.equal(result.system.name, 'test-system');
      assert.include(result.system.versions, '0.0.0');
      assert.include(result.system.versions, '0.1.2');
    })
  .discuss('With an existing version')
  .put('/systems/test-system', testSystem)
    .expect(400)
  .undiscuss()
  .next()
  .del('/systems/test-system/v0.0.0')
    .expect(200)
  .next()
  .undiscuss()
  .get('/systems/test-system')
    .expect(200)
    .expect('Should not have the deleted version', function (err, res, body) {
      assert.isNull(err);
      
      var system = JSON.parse(body).system;
      assert.isObject(system);
      assert.isObject(system.versions);
      assert.equal(system.name, 'test-system');
      assert.include(system.versions, '0.1.2');
      assert.lengthOf(Object.keys(system.versions), 1);
    })
  .export(module);