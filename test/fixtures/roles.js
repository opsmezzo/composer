/*
 * roles.js: Seed data for Role resource.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

module.exports = [{
  resource: 'Role',
  name: 'composer',
  description: 'Resposible for serving systems and config',
  systems: ['composer']
}, {
  resource: 'Role',
  name: 'quill-base',
  description: 'Has quill installed',
  systems: ['quill-base']
}, {
  resource: 'Role',
  name: 'conservatory',
  description: 'Responsible for provisioning new servers',
  systems: ['conservatory']
}];