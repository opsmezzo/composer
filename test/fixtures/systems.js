/*
 * systems.js: Seed data for System resource.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

exports.systems = [{
  resource: 'System',
  name: 'test-system',
  version: '0.0.0',
  description: 'Test fixtures system',
  keywords: ['test', 'fixture', 'seed-data'],
  author: 'Nodejitsu Inc. <info@nodejitsu.com>',
  dependencies: {
    'ubuntu-base': '0.1.0'
  },
  runlist: ['ubuntu-base'],
  files: ['test-config.json'],
  scripts: ['bootstrap.sh', 'image.sh']
}, {
  resource: 'System',
  name: 'test-system-two',
  version: '0.0.0',
  description: 'Test fixtures system (two)',
  keywords: ['test', 'fixture', 'seed-data'],
  author: 'Nodejitsu Inc. <info@nodejitsu.com>',
  dependencies: {
    'ubuntu-base': '0.1.0'
  },
  runlist: ['ubuntu-base'],
  files: ['test-config.json'],
  scripts: ['bootstrap.sh', 'image.sh']
}, {
  resource: 'System',
  name: 'acl-system',
  version: '0.0.0',
  description: 'System with maintainers list',
  keywords: ['acl'],
  author: 'Nodejitsu Inc. <info@nodejitsu.com>',
  maintainers: ['composer'],
  runlist: [],
  files: [],
  scripts: []
}];

exports.missing = [{
  name: 'fixture-one',
  version: '0.0.0',
  description: 'Test fixture one',
  author: 'Nodejitsu Inc <info@nodejitsu.com>'
}, {
  name: 'fixture-two',
  version: '0.0.0',
  description: 'Test fixture two',
  author: 'Nodejitsu Inc <info@nodejitsu.com>'
}];
