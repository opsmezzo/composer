/*
 * start.js: Test helpers starting Conservatory services.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var path = require('path'),
    composer = require('../../lib/composer');

var start = exports;

start.composer = function (port, callback) {
  composer.start(port, function (err) {
    if (err) {
      return callback(err);
    }

    callback(null, composer.server);
  });
};
