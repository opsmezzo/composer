/*
 * index.js: Top-level include for the System resource
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */
 
//
// Expose the System resource
//
module.exports = require('./resource');

//
// Extend the RESTful with routes for `/systems`
//
require('./routes');