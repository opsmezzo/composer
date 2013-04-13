/*
 * config-test.js: Tests for the composer Groups client
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    path = require('path'),
    vows = require('vows'),
    helpers = require('../../helpers');
    
var apiClientContext = helpers.macros.apiClientContext,
    port = 9000, 
    server;

vows.describe('composer/resources/config/client').addBatch(
  helpers.macros.requireComposer(port, function (err, pserver) {
    server = pserver;
  })
).addBatch(apiClientContext({
  "the config.create() method": {
    topic: function (client) {
      client.config.create('test-config', {
        testing: '123',
        'testing again': {
          'an object': 'literal'
        }
      }, this.callback);
    },
    "should respond with no error": function (err, config) {
      assert.isNull(err);
    }
  },
  "the config.get() method": {
    "with a valid config": {
      topic: function (client) {
        client.config.get('production', this.callback);
      },
      "should respond with the config": function (err, config) {
        assert.isNull(err);
        assert.isObject(config);
        assert.equal(config.name, 'production');
        assert.isObject(config.settings);
      }
    },
    "with an invalid config": {
      topic: function (client) {
        client.config.get('invalidsauce', this.callback.bind(null, null));
      },
      "should respond with an appropriate error": function (_, err) {
        assert.isObject(err);
        assert.equal(err.result.error, 'not_found');
      }
    }
  },
  "the config.servers() method": {
    "with no group": {
      topic: function (client) {
        client.config.servers(this.callback)
      },
      "should return the properly indexed data": function (err, config) {
        assert.isNull(err);
        assert.isObject(config);
        ['nodejitsu', 'haibu', 'composer'].forEach(function (system) {
          assert.isArray(config[system]);
        });

        ['composer', 'group-0', 'group-1'].forEach(function (group) {
          assert.isObject(config.groups[group]);
        });
      }
    },
    "with a group": {
      topic: function (client) {
        client.config.servers('group-0', this.callback);
      },
      "should return the properly indexed data": function (err, config) {
        assert.isNull(err);
        assert.isArray(config.haibu);
        assert.lengthOf(config.haibu, 1);
      }
    }
  }
})).addBatch(apiClientContext({
  "the config.destroy() method": {
    topic: function (client) {
      client.config.destroy('test-config', this.callback);
    },
    "should respond with no error": function (err, config) {
      assert.isNull(err);
    }
  }
})).addBatch(apiClientContext({
  "the config.list() method": {
    topic: function (client) {
      client.config.list(this.callback);
    },
    "should respond with a list of config": function (err, config) {
      assert.isNull(err);
      assert.isArray(config);
      assert.lengthOf(config, 2);
      config.forEach(function (config) {
        assert.isObject(config.settings);
        assert.isString(config.name);
      });
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
