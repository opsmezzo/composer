/*
 * resource.js: Config resource model
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var resourceful = require('resourceful'),
    composer = require('../../../composer');

var Config = module.exports = resourceful.define('Config', function () {
  //
  // Create default properties
  //
  this.string('_id')
    .unique(true)
    .sanitize('lower')
    .sanitize('prefix', 'config/');

  this.string('name',     { required: true });
  this.object('settings', { required: true });

  this.timestamps();

  //
  // Setup after hooks for logging core methods.
  //
  var self = this;
  ['get', 'create', 'update', 'destroy'].forEach(function (method) {
    self.after(method, function (_, obj, callback) {
      composer.emit(['config', method], 'info', obj);
      callback();
    });
  });

  // Create default views
  this.filter('all', { include_docs: true }, {
    map: function (doc) {
      if (doc.resource === 'Config') {
        emit(doc._id, { _id: doc._id });
      }
    }
  });
});

//
// ### function set (name, path, value, callback)
// #### @name {string} Name of the config to set the `value` in.
// #### @path {Array} Key path in the `settings` for `value`
// #### @value {*} Value to set
// #### @callback {function} Continuation to respond to when complete.
//
// Sets the `value` at the key `path` in the config with the specified
// name.
//
Config.set = function (name, path, value, callback) {
  Config.get(name, function (err, config) {
    return err ? callback(err) : config.set(path, value, callback);
  });
};

//
// ### function clear (name, path, callback)
// #### @name {string} Name of the config to set the `value` in.
// #### @path {Array} Key path in the `settings` to clear
// #### @callback {function} Continuation to respond to when complete.
//
// Clears the key `path` in the config with the specified name.
//
Config.clear = function (name, path, callback) {
  Config.get(name, function (err, config) {
    return err ? callback(err) : config.clear(path, callback);
  });
};

//
// ### function set (path, value, callback)
// #### @path {Array} Key path in the `settings` for `value`
// #### @value {*} Value to set
// #### @callback {function} Continuation to respond to when complete.
//
// Sets the `value` at the key `path` in this instance.
//
Config.prototype.set = function (path, value, callback) {
  var target = this.settings,
      key;
        
  //
  // Create the nested Object literal as necessary
  //
  while (path.length > 1) {
    key = path.shift();
    
    if (!target[key] || typeof target[key] !== 'object') {
      target[key] = {};
    }
    
    target = target[key];
  }
  
  //
  // Set the target value
  //
  key = path.shift();
  target[key] = value;
  
  this.update({ settings: this.settings }, callback);
};

//
// ### function clear (path, callback)
// #### @path {Array} Key path in the `settings` to clear
// #### @callback {function} Continuation to respond to when complete.
//
// Clears the key `path` in this instance.
//
Config.prototype.clear = function (path, callback) {
  var target = this.settings,
      key;
  
  //
  // Scope into the object to get the appropriate nested context
  //
  while (path.length > 1) {
    key = path.shift();
    if (!target[key]) {
      return;
    }

    target = target[key];
  }

  // Delete the key from the nested JSON structure
  key = path.shift();
  delete target[key];
  
  this.update({ settings: this.settings }, callback);
};
