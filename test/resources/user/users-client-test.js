/*
 * user-client-test.js: Tests for the composer Users client
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

vows.describe('composer/resources/users/client').addBatch(
  helpers.macros.requireComposer(port, function (err, pserver) {
    server = pserver;
  })
).addBatch(apiClientContext('composer', {
  "the users.create() method": {
    topic: function (client) {
      client.users.create({
        username: 'testjitsu',
        password: '1234',
        email: 'testjitsu@test.com'
      }, this.callback);
    },
    "should respond with no error": function (err, _) {
      assert.isNull(err);
    }
  },
  "the users.get() method": {
    "with a valid user": {
      topic: function (client) {
        client.users.get('devjitsu', this.callback);
      },
      "should respond with the user": function (err, user) {
        assert.isNull(err);
        assert.isObject(user);
        assert.equal(user.username, 'devjitsu');
      }
    },
    "with an invalid user": {
      topic: function (client) {
        client.users.get('invalidsauce', this.callback.bind(null, null));
      },
      "should respond with an appropriate error": function (_, err) {
        assert.isObject(err);
        assert.equal(err.status, 404);
      }
    }
  }
})).addBatch(apiClientContext('composer', {
  "the users.list() method": {
    topic: function (client) {
      client.users.list(this.callback);
    },
    "should respond with a list of users": function (err, users) {
      assert.isNull(err);
      assert.isArray(users);
      assert.lengthOf(users, 6);
      users.forEach(function (user) {
        assert.isString(user.username);
        assert.isString(user.email);
      });
    }
  }
})).addBatch(apiClientContext('composer', {
  "the users.destroy() method": {
    topic: function (client) {
      client.users.destroy('testjitsu', this.callback);
    },
    "should respond with no error": function (err, _) {
      assert.isNull(err);
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
