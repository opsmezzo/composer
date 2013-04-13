/*
 * users.js: Seed data for User resource.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
exports.users = [{
  resource: 'User',
  username: 'composer',
  shake: '0123456789',
  email: 'composer@test.com',
  password: '1234'
}, {
  resource: 'User',
  username: 'devjitsu',
  shake: '0123456789',
  email: 'devjitsu@test.com',
  password: '1234',
  permissions: {
    "modify permissions": true,
    "modify users": true
  }
}, {
  resource: 'User',
  username: 'forgot-password',
  shake: '0123456789',
  email: 'forgot-password@test.com',
  password: '1234'
}, {
  resource: 'User',
  username: 'superuser',
  shake: '0123456789',
  email: 'superuser@test.com',
  password: '1234',
  permissions: {
    "superuser": true
  }
}];
