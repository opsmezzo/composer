/*
 * system.js: Base module from which composer systems are created.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var fs = require('fs'),
    path = require('path'),
    BufferedStream = require('union').BufferedStream,
    resourceful = require('resourceful'),
    semver = require('semver'),
    composer = require('../../../composer'),
    async = composer.common.async;

//
// ### function System
//
// Constructor function for the System resource.
//
var System = module.exports = resourceful.define('System', function () {
  //
  // Remark: This should include everything in the package.json
  // spec except: main, bin, scripts, devDependencies, and preferGlobal
  //
  this.string('_id')
    .unique(true)
    .sanitize('lower')
    .sanitize('prefix', 'system/');

  this.string('name', { required: true });
  this.string('version');
  this.string('description');
  this.string('author');
  this.array('keywords');
  this.array('contributors');
  this.array('maintainers');
  this.array('runlist');
  this.object('dependencies');
  this.object('os');
  this.object('ports');
  this.object('vars');

  //
  // Special properties for managing system
  // specific files and scripts.
  //
  // Remark: We should probably have multiple versions of systems documents
  //         with a single attachment because these properties will only be
  //         valid for the latest version.
  //
  this.array('files');
  this.array('scripts');
  this.array('templates');
  this.object('versions');

  this.timestamps();

  //
  // Setup after hooks for logging core methods.
  //
  var self = this;
  ['get', 'create', 'update', 'destroy'].forEach(function (method) {
    self.after(method, function (_, obj, callback) {
      composer.emit(['system', method], 'info', obj);
      callback();
    });
  });

  //
  // When creating a system resource ensure that `this.version` is
  // populated with the initial version
  //
  this.before('create', function (obj, callback) {
    var version = composer.common.clone(obj),
        versionName;

    obj.version  = obj.version  || '0.0.0';
    obj.versions = obj.versions || {};
    delete version.versions;
    delete version.ctime;
    delete version.mtime;
    delete version._id;
    
    versionName = obj.version[0] === 'v'
      ? obj.version.slice(1)
      : obj.version;
    
    obj.versions[versionName] = version;
    callback();
  });

  // Create default views
  this.filter('all', { include_docs: true }, {
    map: function (doc) {
      if (doc.resource === 'System') {
        emit(doc._id, { _id: doc._id });
      }
    }
  });
});

//
// ### function addVersion (system, callback)
// #### @system {Object} Properties for the version to add.
// #### @callback {function} Continuation to respond to when compelte.
//
// Adds the specified `system` version to this instance.
//
System.prototype.addVersion = function (system, callback) {
  var self = this,
      current = this.toJSON(),
      version,
      max;

  version = system.version[0] === 'v'
    ? system.version.slice(1)
    : system.version;

  if (this.versions && this.versions[version]) {
    return callback(new Error('Cannot add existing version: ' + version));
  }

  max = semver.maxSatisfying(Object.keys(this.versions), version);

  //
  // Hoist properties on the current version.
  //
  // Remark: What if the version is old? We should probably hoist from the
  //         last version valid with semver.
  //
  Object.keys(current).forEach(function (key) {
    if (['_id', '_rev', '_attachments', 'resource', 'versions', 'maintainers'].indexOf(key) !== -1) {
      return;
    }

    system[key] = system[key] || current[key];
  });

  //
  // Add any relevant maintainers.
  //
  this.addOwners(current.maintainers);

  //
  // If the version being added is the latest update
  // the "main" properties on this instance.
  //
  if (!max || semver.eq(max, version)) {
    Object.keys(system).forEach(function (key) {
      self[key] = system[key];
    });
  }

  this.versions[version] = system;
  this.update(this, callback);
};

//
// ### function removeVersion (version, callback)
// #### @version {string} Name of the version to remove.
// #### @callback {function} Continuation to respond to when compelte.
//
// Removes the specified `version` from this instance.
//
System.prototype.removeVersion = function (version, callback) {
  var self = this;

  version = version[0] === 'v' ? version.slice(1) : version;

  if (!this.versions || !this.versions[version]) {
    return callback(new Error('Version not found: ' + version));
  }

  function onComplete(err, res) {
    if (!err && self.constructor.connection.cache.has(self._id)) {
      self.constructor.connection.cache.clear(self._id);
    }

    return err
      ? callback(err)
      : callback(null, res);
  }

  delete this.versions[version];

  this.update(this, function (err) {
    if (err) {
      return callback(err);
    }

    self.constructor.connection.connection.removeAttachment({
      id: self._id,
      rev: self._rev
    }, version + '.tgz', onComplete);
  });
};

//
// ### function upload (version, data, callback)
// #### @version {string} **Optional** Name of the version upload.
// #### @stream {string} Data to use for the CouchDB attachment.
// #### @callback {function} Continuation to respond to when compelte.
// Uploads the specified `version` with `data` to this system resource.
//
System.prototype.upload = function (version, stream, callback) {
  version = version[0] === 'v' ? version.slice(1) : version;

  var filename = version + '.tgz',
      self = this;

  if (this._attachments && this._attachments[filename]) {
    return callback(new Error('Cannot add existing version ' + version));
  }

  function onComplete(err, res) {
    if (!err && self.constructor.connection.cache.has(self._id)) {
      self.constructor.connection.cache.clear(self._id);
    }

    return err
      ? callback(err)
      : callback(null, res);
  }

  stream.pipe(this.constructor.connection.connection.saveAttachment({
      id: this._id,
      rev: this._rev,
    }, {
      name: filename,
      contentType: 'application/x-tar-gz'
    },
    onComplete
  ));
};

//
// ### function download (version, callback)
// #### @version {string} **Optional** Name of the version to download.
// #### @callback {function} Continuation to respond to when compelte.
// Retreives the specified `version` for this system resource.
//
System.prototype.download = function (version, callback) {
  version = version[0] === 'v' ? version.slice(1) : version;

  var stream = new BufferedStream(),
      filename = version + '.tgz',
      data = '',
      responded,
      req;

  if (!this._attachments || !this._attachments[filename]) {
    return callback(new Error('No data for version ' + version));
  }

  //
  // Helper function for checking multiple
  // return conditions.
  //
  function respond(err, res) {
    if (!responded) {
      responded = true;
      return !err
        ? callback(null, res.headers)
        : callback(err);
    }
  }

  req = this.constructor.connection.connection.getAttachment(
    this._id,
    filename
  );

  req.pipe(stream);
  req.on('response', respond.bind(null, null));
  req.on('error', respond);

  return stream;
};

//
// ### function addOwners (maintainers)
// #### @maintainers {Array} Owners to add to this instance.
// Adds the specified `maintainers` to this instance
//
System.prototype.addOwners = function (maintainers) {
  var self = this;

  //
  // Merge any additional maintainers from the current version
  // to this version.
  //
  if (Array.isArray(maintainers)) {
    maintainers.forEach(function (user) {
      if (typeof user !== 'string'
          || self.maintainers.indexOf(user) !== -1) {
        return;
      }

      self.maintainers.push(user);
    });
  }
};

//
// ### function removeOwners (maintainers)
// #### @maintainers {Array} Owners to remove from this instance.
// Removes the specified `maintainers` from this instance
//
System.prototype.removeOwners = function (maintainers) {
  var self = this;

  //
  // Merge any additional maintainers from the current version
  // to this version.
  //
  if (Array.isArray(maintainers)) {
    this.maintainers = this.maintainers.filter(function (user) {
      return maintainers.indexOf(user) === -1;
    });
  }
};