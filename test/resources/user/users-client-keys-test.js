/*
 * user-client-keys-test.js: Tests for the composer Users client and SSH keys
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    path = require('path'),
    vows = require('vows'),
    helpers = require('../../helpers');
    
var apiClientContext = helpers.macros.apiClientContext,
    key = '1234567890zyxwvut1234567890zyxwvut1234567890zyxwvut',
    port = 9000, 
    server;

vows.describe('composer/resources/users/client/keys').addBatch(
  helpers.macros.requireComposer(port, function (err, pserver) {
    server = pserver;
  })
).addBatch(apiClientContext('composer', {
  "the users.getKey() method": {
    "with a valid keyname": {
      topic: function (client) {
        client.users.getKey('charlie', 'publicKey', this.callback);
      },
      "should respond with the key": function (err, result) {
        assert.isNull(err);
        assert.isObject(result);
        assert.include(result, 'username');
        assert.include(result, 'name');
        assert.include(result, 'key');      }
    },
    "with an invalid keyname": {
      topic: function (client) {
        client.users.getKey('charlie', 'noexistkey', this.callback);
      },
      "should respond with the appropriate error": function (err, key) {
        assert.isObject(err);
        assert.isObject(err.result);
        assert.equal(err.result.error, 'not_found');
      }
    },
    "with an invalid user": {
      topic: function (client) {
        client.users.getKey('noexistuser', 'noexistkey', this.callback);
      },
      "should respond with the appropriate error": function (err, key) {
        assert.isObject(err);
        assert.isObject(err.result);
        assert.equal(err.result.error, 'not_found');
      }
    }
  },
  "the users.getKeys() method": {
    "for all users": {
      topic: function (client) {
        client.users.getKeys(this.callback)
      },
      "should respond with all keys": function (err, keys) {
        assert.isNull(err);
        assert.isArray(keys);
        assert.isTrue(keys.length > 0);
      }
    },
    "for a valid user": {
      topic: function (client) {
        client.users.getKeys('charlie', this.callback)
      },
      "should respond with all keys": function (err, keys) {
        assert.isNull(err);
        assert.isArray(keys);
        assert.lengthOf(keys, 1);
      }
    },
    "for an invalid user": {
      topic: function (client) {
        client.users.getKeys('noexistuser', this.callback)
      },
      "should respond with no keys": function (err, keys) {
        assert.isNull(err);
        assert.isArray(keys);
        assert.lengthOf(keys, 0);
      }
    }
  },
  "the users.addKey() method": {
    "with a valid user": {
      "with a specific keyname": {
        topic: function (client) {
          client.users.addKey('composer', 'someKey', key, this.callback)
        },
        "should respond with no error": function (err, _) {
          assert.isNull(err);
        }
      }
    },
    "with an invalid user": {
      topic: function (client) {
        client.users.addKey('noexistuser', key, this.callback.bind(null, null))
      },
      "should respond with the appropriate error": function (_, err) {
        assert.isObject(err);
        assert.isObject(err.result);
        assert.equal(err.result.error, 'not_found');
      }
    }
  }
})).addBatch(apiClientContext('composer', {
  "the users.addKey() method": {
    "with a valid user": {
      "with no keyname": {
        topic: function (client) {
          client.users.addKey('composer', key, this.callback)
        },
        "should respond with no error": function (err, _) {
          assert.isNull(err);
        }
      }
    }
  },
  "the users.getKey() method": {
    "with the newly added keyname": {
      topic: function (client) {
        client.users.getKey('composer', 'someKey', this.callback);
      },
      "should respond with the key": function (err, result) {
        assert.isNull(err);
        assert.isObject(result);
        assert.equal(result.key, key);
      }
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
