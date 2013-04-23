/*
 * helpers.js: Test helpers for the Conservatory module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var path = require('path'),
    fs = require('fs'),
    composer = require('../../lib/composer'),
    base64 = composer.common.base64;

composer.config.use('env', {
  type: 'file',
  file: path.join(__dirname, '..', '..', 'config', 'env', 'development.json')
});

exports.nock   = require('./nock');
exports.macros = require('./macros');
exports.start  = require('./start');

exports.init = function (callback) {  
  composer.init(callback);
};

exports.createClient = function createClient(provider, config) {
  config.provider = provider;

  // use your key for testing, so our credentials dont need to go in the repo
  if (provider === 'joyent') {
    if (!config.username) {
      if (!config.account) {
        config.account = process.env.SDC_CLI_ACCOUNT;
      }

      if (!config.identity) {
        if (process.env.SDC_CLI_IDENTITY) {
          config.identity = process.env.SDC_CLI_IDENTITY;
        } else {
          config.identity = process.env.HOME + '/.ssh/id_rsa';
        }
      }

      if (!config.keyId) {
        if (process.env.SDC_CLI_KEY_ID) {
          config.keyId = process.env.SDC_CLI_KEY_ID;
        } else {
          config.keyId = 'id_rsa';
        }
      }
      if (config.account) {
        config.keyId = '/' + config.account + '/keys/' + config.keyId;
        config.key   = fs.readFileSync(config.identity,'ascii');
      } else {
        throw new Error("Can't test without username and account");
      }
    }
  }
  var final_cfg = { env: 'development', silent: false, compute: config };
  return new composer.provisioner.Bootstrapper(final_cfg);
};

exports.testApi = function (suite, port) {
  var auth = composer.config.get('auth');
  
  return suite.use('localhost', port)
    .setHeader('Content-Type', 'application/json')
    .setHeader('Authorization', 'Basic ' + 
      base64.encode([auth.username, auth.password].join(':')));
};