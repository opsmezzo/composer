/*
 * system-api-version-tarball-test.js: Tests for the tarballs in the 'system' resource's RESTful API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    apiEasy = require('api-easy'),
    base64 = require('flatiron').common.base64,
    request = require('request'),
    helpers = require('../../helpers'),
    auth = require('../../../lib/composer').config.get('auth');
    
var fixturesDir = path.join(__dirname, '..', '..', 'fixtures'),
    downloadDir = path.join(fixturesDir, 'download'),
    systemsDir = path.join(fixturesDir, 'systems'),
    tarball = fs.readFileSync(path.join(systemsDir, 'redis.tgz')),
    authHeader = 'Basic ' + base64.encode([auth.username, auth.password].join(':')),
    port = 9002;

var suite = apiEasy.describe('composer/resources/systems/api/versions/tarball').addBatch(
  helpers.macros.requireComposer(port)
);

suite.use('localhost', port)
  .setHeader('content-type', 'application/x-tar-gz')
  .setHeader('Authorization', authHeader) 
  .put('/systems/test-system/v0.0.0', tarball)
    .expect(200)
  .next()
  .put('/systems/test-system/v0.1.2', tarball)
    .expect(200)
  .addBatch({
    "GET to /systems/test-system/v0.1.2": {
      topic: function () {
        request({
          uri: 'http://localhost:9002/systems/test-system/v0.1.2',
          headers: {
            authorization: authHeader
          }
        }, this.callback).pipe(fs.createWriteStream(path.join(downloadDir, 'redis.tgz')));
      },
      "should respond with 200": function (err, res, body) {
        assert.equal(res.statusCode, 200);
      }
    }
  })
  .next()
  .discuss('When a version already exists')
  .put('/systems/test-system/v0.1.2', tarball)
    .expect(400)
  .undiscuss()
  .get('/systems/test-system/v9.9.9')
    .expect(404)

  .next()
  .discuss('When user who is not a maintainer tries creating a version')
    .put('/systems/acl-system/v0.0.0', tarball)
      .expect(403)
  .undiscuss()
  .next()
  .discuss('When user who is a maintainer tries creating a version')
    .authenticate('composer', '1234')
    .put('/systems/acl-system/v0.0.0', tarball)
      .expect(200)
  .undiscuss()
  .next()
  .discuss('When user who is a superuser tries creating a version')
    .authenticate('superuser', '1234')
    .put('/systems/acl-system/v0.0.1', tarball)
      .expect(200)
  .undiscuss()

  .export(module);
