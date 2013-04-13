/*
 * macros.js: Test macros for the Conservatory module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    composer = require('../../lib/composer'),
    helpers = require('./index'),
    start = require('./start'),
    users = require('../fixtures/users').users,
    composerApi = require('composer-api');

var devjitsu = users[1];

var macros = exports;

macros.requireInit = function (initialized) {
  return {
    "This test requires composer.init": {
      topic: function () {
        helpers.init(this.callback);
      },
      "should respond with no error": function (err) {
        assert.isTrue(typeof err === 'undefined');
        if (initialized) {
          initialized();
        }
      }
    }
  };
};

macros.requireComposer = function (port, callback) {
  return {
    "This test requires composer.composer.start": {
      topic: function () {
        start.composer(port, this.callback);    
      },
      "should actually fire init": function (err, server) {
        assert.isNull(err);
        assert.isObject(server);
        if (callback) {
          callback(null, server)
        }
      }
    }
  };
};

macros.apiClientContext = function (options, nested) {
  if (typeof nested === 'undefined') {
    nested = options;
    options = { auth: devjitsu };
  }

  var context = {
    topic: function () {
      return composerApi.createClient(options);
    }
  };
  
  Object.keys(nested).forEach(function (vow) {
    context[vow] = nested[vow];
  });
  
  return {
    "When using a client from composer.createClient": context
  };
};

macros.ensureValidService = function (suite, missing) {
  var pkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')
  );

  suite.get('/version')
    .expect(200)
    .expect('should respond with the correct version', function (error, response, body) {
      var result = JSON.parse(body);
      assert.isObject(result);
      assert.equal(result.version, 'composer ' + pkg.version);
    })
    .expect('should respond with `x-powered-by` composer', function (error, response, body) {
      assert.isNull(error);
      assert.equal(response.headers['x-powered-by'], 'composer ' + pkg.version);
    });

  missing.forEach(function (route) {
    suite.get(route).expect(404);
  });

  return suite;
};
