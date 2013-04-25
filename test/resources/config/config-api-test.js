/*
 * groups-api-test.js: Tests for the 'group' resources's RESTful API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    apiEasy = require('api-easy'),
    helpers = require('../../helpers');

var port = 9002;

var suite = apiEasy.describe('composer/resources/config/api').addBatch(
  helpers.macros.requireComposer(port)
);

//
// Mock out the API requests to conservatory
// using `nock`.
//
helpers.nock.roles(2);
helpers.nock.servers(1);
helpers.nock.clusterServers('main', 1);

helpers.testApi(suite, port)
  .put('/config/staging/foo', { bar: 'whatever' })
    .expect(200)
  .next()
  .put('/config/staging/test-delete', { again: 'whatever' })
    .expect(200)
  .next()
  .del('/config/staging/test-delete')
    .expect(200)
  .next()
  .get('/config/staging')
    .expect(200)
    .expect('should respond with the correct settings', function (error, res, body) {
      var result = JSON.parse(body);
      assert.isObject(result.config);
      assert.isObject(result.config.settings);
      assert.isObject(result.config.settings.foo);
      assert.isTrue(!result.config.settings['test-delete']);
    })
  .post('/config/test-config', {
    testing: '123',
    'testing again': {
      'an object': 'literal'
    }
  }).expect(201)
  .next()
  .get('/config/test-config')
    .expect(200)
  .del('/config/test-config')
    .expect(200)
  .next()
  .get('/config')
    .expect(200)
    .expect('should respond with a list of configs', function (error, response, body) {
      var result = JSON.parse(body);
      assert.isObject(result);
      assert.isArray(result.config);
      assert.lengthOf(result.config, 2);
    })
  .post('/config/servers', {})
    .expect(400)
  .put('/config/servers/foo', { bar: true })
    .expect(400)
  .del('/config/servers')
    .expect(400)
  .del('/config/servers/foo')
    .expect(400)
  .get('/config/servers')
    .expect(200)
    .expect('should return the properly indexed data', function (err, res, body) {
      assert.isNull(err);
      var config = JSON.parse(body);

      assert.isObject(config);
      ['composer', 'conservatory', 'quill-base'].forEach(function (system) {
        assert.isArray(config[system]);
      });

      ['main', 'staging'].forEach(function (group) {
        assert.isObject(config.clusters[group]);
      });
    })
  .get('/config/servers/main')
    .expect(200)
    .expect('should return the properly indexed data', function (err, res, body) {
      assert.isNull(err);
      var config = JSON.parse(body);
      ['conservatory', 'composer'].forEach(function (role) {
        assert.isArray(config[role]);
        assert.lengthOf(config[role], 1);
      });
    });
suite.export(module);
