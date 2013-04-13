/*
 * config.js: Seed data for Config resource.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
exports.config = [{
  resource: 'Config',
  name: 'staging',
  settings: {
    logs: {
      foo: 'bar'
    },
    bazz: 'buzz'
  }
}, {
  resource: 'Config',
  name: 'production',
  settings: {
    logs: {
      foo: 'bar'
    },
    bazz: 'buzz'
  }
}];