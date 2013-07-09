/*
 * roles.js: Seed data for Role resource.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

module.exports = [{
  resource: 'Role',
  name: 'composer',
  version: '1.0.0',
  description: 'Resposible for serving systems and config',
  dependencies: {
    'composer': '1.0.x'
  }
}, {
  resource: 'Role',
  name: 'quill-base',
  version: '1.0.0',
  description: 'Has quill installed',
  dependencies: {
    'quill-base': '1.0.x'
  }
}, {
  resource: 'Role',
  name: 'conservatory',
  version: '1.0.0',
  description: 'Responsible for provisioning new servers',
  dependencies: {
    'conservatory': '1.0.x'
  }
}];
