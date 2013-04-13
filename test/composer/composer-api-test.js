/*
 * provisioner-api-test.js: Tests for the 'provisioner' module's RESTful API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    apiEasy = require('api-easy'),
    helpers = require('../helpers'),
    macros = helpers.macros;
    
var port = 9002;

var suite = apiEasy.describe('composer/composer/api').addBatch(
  helpers.macros.requireComposer(port, function (err, pserver) {
    server = pserver;
  })
);

//
// Test `GET /version` route
// Ensure `GET /servers` ==> 404
// Ensure `GET /groups` ==> 404
// Ensure `GET /roles` ==> 404
//
macros.ensureValidService(
  helpers.testApi(suite, port),
  ['groups', 'roles', 'servers']
).export(module);