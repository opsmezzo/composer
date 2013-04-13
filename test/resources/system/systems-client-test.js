/*
 * systems-client-test.js: Tests for the composer Systems client
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
    port = 9000, 
    server;

vows.describe('composer/resources/systems/client').addBatch(
  helpers.macros.requireComposer(port, function (err, pserver) {
    server = pserver;
  })
).addBatch(apiClientContext('composer', {
  "the systems.create() method": {
    topic: function (client) {
      client.systems.create(missing[1], this.callback);
    },
    "should respond with no error": function (err, system) {
      assert.isNull(err);
    }
  },
  "the systems.get() method": {
    "with a valid system": {
      topic: function (client) {
        client.systems.get('test-system', this.callback);
      },
      "should respond with the system": function (err, system) {
        assert.isNull(err);
        assert.isObject(system);
        assert.equal(system.name, 'test-system');
      }
    },
    "with an invalid system": {
      topic: function (client) {
        client.systems.get('invalidsauce', this.callback.bind(null, null));
      },
      "should respond with an appropriate error": function (_, err) {
        assert.isObject(err);
        assert.equal(err.result.error, 'not_found');
      }
    }
  }
})).addBatch(apiClientContext('composer', {
  "the systems.destroy() method": {
    topic: function (client) {
      client.systems.destroy('fixture-two', this.callback);
    },
    "should respond with no error": function (err, system) {
      assert.isNull(err);
    }
  }
})).addBatch(apiClientContext('composer', {
  "the systems.list() method": {
    topic: function (client) {
      client.systems.list(this.callback);
    },
    "should respond with a list of systems": function (err, systems) {
      assert.isNull(err);
      assert.isArray(systems);
      assert.lengthOf(systems, 3);
    }
  }
})).addBatch({
  "With an invalid maintainer": apiClientContext('composer', {
    "systems.addOwner()": {
      topic: function (client) {
        client.systems.addOwner('acl-system', ['devjitsu'], this.callback);
      },
      "should respond with the appropriate error": function (err, _) {
        assert.isObject(err);
      }
    }
  })
}).addBatch({
  "With a valid maintainer": apiClientContext({
    type: 'composer',
    auth: {
      username: 'composer',
      password: '1234'
    }
  }, {
    "systems.addOwner()": {
      topic: function (client) {
        this.client = client;
        client.systems.addOwner('acl-system', ['devjitsu'], this.callback.bind(this));
      },
      "should respond with the appropriate error": function (err, _) {
        assert.isNull(err);
        assert.isTrue(!_);
      },
      "and should": {
        topic: function () {
          this.client.systems.get('acl-system', this.callback)
        },
        "update the system correctly": function (err, system) {
          assert.isNull(err);
          assert.isObject(system);
          assert.isArray(system.maintainers);
          assert.deepEqual(system.maintainers, ['composer', 'devjitsu']);
        }
      }
    }
  })
}).addBatch({
  "With a valid maintainer": apiClientContext({
    type: 'composer',
    auth: {
      username: 'composer',
      password: '1234'
    }
  }, {
    "systems.removeOwner()": {
      topic: function (client) {
        this.client = client;
        client.systems.removeOwner('acl-system', ['devjitsu'], this.callback.bind(this));
      },
      "should respond with the appropriate error": function (err, _) {
        assert.isNull(err);
        assert.isTrue(!_);
      },
      "and should": {
        topic: function () {
          this.client.systems.get('acl-system', this.callback)
        },
        "update the system correctly": function (err, system) {
          assert.isNull(err);
          assert.isObject(system);
          assert.isArray(system.maintainers);
          assert.deepEqual(system.maintainers, ['composer']);
        }
      }
    }
  })
}).addBatch({
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
