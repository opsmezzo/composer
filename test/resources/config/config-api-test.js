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
      ['nodejitsu', 'haibu', 'composer'].forEach(function (system) {
        assert.isArray(config[system]);
      });

      ['composer', 'group-0', 'group-1'].forEach(function (group) {
        assert.isObject(config.groups[group]);
      });
    })
  .get('/config/servers/group-0')
    .expect(200)
    .expect('should return the properly indexed data', function (err, res, body) {
      assert.isNull(err);
      var config = JSON.parse(body);
      assert.isArray(config.haibu);
      assert.lengthOf(config.haibu, 1);
    });
suite.export(module);