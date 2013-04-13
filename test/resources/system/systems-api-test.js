/*
 * systems-api-test.js: Tests for the 'system' resource's RESTful API.
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
    aclSystem = systems[2],
    port = 9002;

testSystem.version = '0.1.2';

var suite = apiEasy.describe('composer/resources/systems/api').addBatch(
  helpers.macros.requireComposer(port)
);

helpers.testApi(suite, port)
  .post('/systems/fixture-one', fixtureOne)
    .expect(201)
  .next()
  .get('/systems')
    .expect(200)
    .expect('should respond with a list of systems', function (err, res, body) {
      assert.isNull(err);
      
      var result = JSON.parse(body);
      assert.isArray(result.systems);
      assert.lengthOf(result.systems, 4);
    })
  .get('/systems/test-system')
    .expect(200)
    .expect('should respond with the system', function (err, res, body) {
      assert.isNull(err);
      
      var result = JSON.parse(body);
      assert.isObject(result.system);
      assert.equal(result.system.name, 'test-system');
    })
  .undiscuss()
  .discuss('When a system exists')
  .post('/systems/fixture-one', fixtureOne)
    .expect(409)
  .next()
  .del('/systems/fixture-one')
    .expect(200)
  .undiscuss()
  .next()
  .discuss('When a system doesnt exist')
    .del('/systems/fixture-one')
      .expect(404)
  .undiscuss()
  .next()
  .discuss('When user is not a system maintainter')
    .del('/systems/acl-system')
      .expect(403)
    .put('/systems/acl-system', { author: 'mmalecki' })
      .expect(403)
    .put('/systems/acl-system/owners', ['devjitsu'])
      .expect(403)
    .del('/systems/acl-system/owners', ['composer'])
      .expect(403)
  .undiscuss()
  .next()
  .authenticate('composer', '1234')
  .discuss('When user is a system maintainter')
    .put('/systems/acl-system/owners', ['devjitsu'])
      .expect(204)
    .next()
    .get('/systems/acl-system')
      .expect(200)
      .expect('should update the maintainers', function (err, res, body) {
        assert.isNull(err);
        system = JSON.parse(body).system;
        assert.deepEqual(system.maintainers, ['composer', 'devjitsu']);
      })
    .discuss('With malformed owners')
      .put('/systems/acl-system/owners', 'foobar')
        .expect(400)
      .del('/systems/acl-system/owners', 'foobar')
        .expect(400)
    .undiscuss()
  .undiscuss()
  .next()
  .authenticate('devjitsu', '1234')
  .discuss('Once a user has been added as a maintainer')
    .del('/systems/acl-system/owners', ['composer'])
      .expect(204)
    .next()
    .get('/systems/acl-system')
      .expect(200)
      .expect('should update the maintainers', function (err, res, body) {
        assert.isNull(err);
        system = JSON.parse(body).system;
        assert.deepEqual(system.maintainers, ['devjitsu']);
      })
    .next()
    .del('/systems/acl-system')
      .expect(200)
  .undiscuss()
  .authenticate('composer', '1234')
  .next()
    //
    // Restore previous state (recreate `acl-system`).
    //
    .post('/systems/acl-system', aclSystem)
      .expect(201)
  .export(module);
