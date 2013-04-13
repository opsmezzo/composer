/*
 * systems-client-test.js: Tests for the composer Systems client
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    helpers = require('../../helpers'),
    fixtures = require('../../fixtures/systems'),
    systems = fixtures.systems,
    missing = fixtures.missing;

var apiClientContext = helpers.macros.apiClientContext,
    fixturesDir = path.join(__dirname, '..', '..', 'fixtures'),
    downloadDir = path.join(fixturesDir, 'download'),
    systemsDir = path.join(fixturesDir, 'systems'),
    tarball = path.join(systemsDir, 'redis.tgz'),
    target = path.join(downloadDir, 'redis2.tgz'),
    port = 9000, 
    server;

function shouldContainVersions(name, versions) {
  return {
    topic: function (client) {
      client.systems.get(name, this.callback);
    },
    "should contain the appropriate versions": function (err, system) {
      assert.isNull(err);
      assert.isObject(system);
      assert.isObject(system._attachments);
      versions.forEach(function (version) {
        assert.include(system._attachments, version + '.tgz');
      });
    }
  }
}

function shouldUploadVersion(name, version, assertion) {
  return {
    topic: function (client) {
      var stream = fs.createReadStream(tarball);

      stream.pipe(client.systems.upload(name, version, this.callback));
    },
    "should respond with no error": assertion || function (err, res) {
      assert.isNull(err);
      assert.equal(res.statusCode, 200);
    }
  }
}

vows.describe('composer/resources/systems/client/versions/tarball').addBatch(
  helpers.macros.requireComposer(port, function (err, pserver) {
    server = pserver;
  })
).addBatch(apiClientContext({
  "the systems.upload() method": {
    "v0.0.0": shouldUploadVersion('test-system-two', 'v0.0.0'),
  }
})).addBatch(apiClientContext({
  "the systems.upload() method": {
    "v0.1.2": shouldUploadVersion('test-system-two', 'v0.1.2')
  }
})).addBatch(apiClientContext({
  "the systems.upload() method": {
    "with an existing version": shouldUploadVersion('test-system-two', 'v0.1.2', function (err, _) {
      assert.equal(err.status, 400);
    })
  },
  "the systems.download() method": {
    "with a version that exists": {
      topic: function (client) {
        client.systems.download('test-system-two', 'v0.1.2', this.callback)
          .pipe(fs.createWriteStream(target));
      },
      "should respond with 200": function (err, res) {
        assert.isNull(err);
        assert.equal(res.statusCode, 200);
        
        try { assert.isObject(fs.statSync(target)) }
        catch (ex) { assert.isNull(err) }
      }
    },
    "with a version that doesnt exist": {
      topic: function (client) {
        client.systems.download('test-system-two', 'v9.9.9', this.callback);
      },
      "should respond with 404": function (err, res) {
        assert.equal(err.status, 404);
      }
    }
  }
}))/*.addBatch(apiClientContext({
  "the systems.get() method": shouldContainVersions(
    'test-system-two',
    ['0.0.0', '0.1.2']
  )
})).addBatch(apiClientContext({
  "the systems.download() method": {
    "with a version that doesnt exist": {
      topic: function (client) {
        client.systems.download('test-system', 'v0.9.9', this.callback.bind(null, null));
      },
      "should respond with the appropriate error": function (_, err) {
        assert.equal(err.status, 404);
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
})*/.export(module);
