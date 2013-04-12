/*
 * index.js: Top-level include for the Config resource
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */
 
//
// Expose the Config resource
//
module.exports = require('./resource');

//
// Extend the RESTful with routes for `/config`
//
require('./routes');