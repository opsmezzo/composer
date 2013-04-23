/*
 * nock.js: Mock HTTP fixtures for talkingt to remote APIs.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var path = require('path'),
    nock = require('nock'),
    roles = require('../fixtures/roles'),
    servers = require('../fixtures/servers'),
    config = require('../../config/env/development');

var provisioner = config.provisioner || {},
    host = provisioner.host || 'mock.provisioner.opsmezzo.com',
    port = provisioner.port || 9003
    api = nock('http://' + host + ':' + port);

//
// ### function roles (requests)
// Mocks a request to list roles for a given
// number of `requests`.
//
exports.roles = function (requests) {
  for (var i = 0; i < requests; i++) {
    api.get('/roles').reply(200, {
      roles: roles
    });
  }
};

//
// ### function servers (requests)
// Mocks a request to list servers for a given
// number of `requests`.
//
exports.servers = function (requests) {
  for (var i = 0; i < requests; i++) {
    api.get('/servers').reply(200, {
      servers: servers
    });
  }
};

//
// ### function groupServers (requests)
// Mocks a request to list servers in a group
// for a given number of `requests`.
//
exports.groupServers = function (group, requests) {
  for (var i = 0; i < requests; i++) {
    api.get('/groups/' + group + '/servers').reply(200, {
      servers: servers.filter(function (server) {
        return server.group === group;
      })
    });
  }
};