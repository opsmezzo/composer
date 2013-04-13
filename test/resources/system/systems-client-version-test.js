/*
 * systems-client-version-test.js: Tests for the composer Systems client (versions)
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    path = require('path'),
    vows = require('vows'),
    helpers = require('../../helpers'),
    fixtures = require('../../fixtures/systems'),
    systems = fixtures.systems,
    missing = fixtures.missing;
    
var apiClientContext = helpers.macros.apiClientContext,
    testSystem = systems[1],
    fixtureOne = missing[0],
    port = 9000, 
    server;

testSystem.version = '0.1.2';

vows.describe('composer/resources/systems/client').addBatch(
  helpers.macros.requireComposer(port, function (err, pserver) {
    server = pserver;
  })
).addBatch(apiClientContext({
  "with a new version": {
    "the systems.addVersion() method": {
      topic: function (client) {
        client.systems.addVersion(testSystem, this.callback);
      },
      "should respond with no error": function (err, _) {
        assert.isNull(err);
      }
    }
  }
})).addBatch(apiClientContext({
  "the systems.get() method": {
    topic: function (client) {
      client.systems.get('test-system-two', this.callback);
    },
    "should respond with both versions": function (err, system) {
      assert.isObject(system);
      assert.isObject(system.versions);
      assert.equal(system.name, 'test-system-two');
      assert.include(system.versions, '0.0.0');
      assert.include(system.versions, '0.1.2');
    }
  },
  "with an existing version": {
    "the systems.addVersion() method": {
      topic: function (client) {
        client.systems.addVersion(testSystem, this.callback);
      },
      "should respond with the correct error": function (err, _) {
        assert.isObject(err);
        assert.equal(err.status, 400);
      }
    }
  }
})).addBatch(apiClientContext({
  "the systems.removeVersion() method": {
    "with a version that exists": {
      topic: function (client) {
        client.systems.removeVersion('test-system-two', 'v0.0.0', this.callback)
      },
      "should respond with no error": function (err, _) {
        assert.isNull(err);
      }
    },
    "with a version that doesnt exist": {
      topic: function (client) {
        client.systems.removeVersion('test-system-two', 'v9.0.0', this.callback)
      },
      "should respond with the correct error": function (err, _) {
        assert.isObject(err);
        assert.equal(err.status, 404);
      }
    }
  }
})).addBatch(apiClientContext({
  "the systems.get() method": {
    topic: function (client) {
      client.systems.get('test-system-two', this.callback);
    },
    "should not have the deleted version": function (err, system) {
      assert.isObject(system);
      assert.isObject(system.versions);
      assert.equal(system.name, 'test-system-two');
      assert.include(system.versions, '0.1.2');
      assert.lengthOf(Object.keys(system.versions), 1);
    }
  }
})).addBatch({
  "When the tests are over": {
    topic: function () {
      server.close();
      return true;
    },
    "the server should clean up": function (stopped) {
      assert.isTrue(stopped);
    }  
  }
}).export(module);
