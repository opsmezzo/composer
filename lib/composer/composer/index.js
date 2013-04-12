/*
 * index.js: Top level include for the composer module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var composer = require('../../composer');

var composer = exports;

//
// ### function start (options, callback)
// #### @options {Object} Options to initialize with.
// #### @callback {function} Continuation to respond to when complete.
// Starts the RESTful composer web service.
//
composer.start = function (options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  //
  // Helper function which actually starts the
  // composer service.
  //
  function _start(err) {
    if (err) {
      return callback(err);
    }

    //
    // Extend composer with routes for `/keys`
    //
    composer.use(composer._plugins.keys);
    
    if (options.port) {
      composer.listen(options.port);
    }

    callback(null, composer.server);
  }

  //
  // Use the `composer` plugin to restrict the API
  // to only those routes used.
  //
  composer.use(composer._plugins.composer);

  return !composer.initialized
    ? composer.init(options, _start)
    : _start();
};