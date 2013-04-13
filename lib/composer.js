/*
 * composer.js: Top-level include for the composer module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var path = require('path'),
    director = require('director'),
    flatiron = require('flatiron'),
    resourceful = require('resourceful');

var composer = module.exports = new flatiron.App({
  delimiter: ':',
  root: path.join(__dirname, '..'),
  directories: {
    config: '#ROOT/config',
    keys: '#ROOT/keys',
    tmp: '#ROOT/tmp'
  }
});

//
// Expose version information through `pkginfo`
//
require('pkginfo')(module, 'version');

//
// Require `winston-loggly` to add the
// `Loggly` transport
//
require('winston-loggly');

//
// Disable the `resourceful` cache until it stablizes
//
resourceful.cache = false;

//
// ### Export core `composer` modules.
//
composer.common      = require('./composer/common');
composer.composer    = require('./composer/composer');
composer._plugins    = require('./composer/plugins');

//
// Setup the `unauthorized` router.
//
composer.unauthorized = new director.http.Router().configure({
  async: true,
  strict: false
});

//
// Allow trailing `/`
//
composer.unauthorized.strict = false;

//
// ### Default Route
// GET '/' responds with `400`, `No resource specified`.
//
composer.unauthorized.get('/', function () {
  this.res.json(400, { message: 'No resource specified' });
});

//
// ### Version Binding
// `GET /version` returns the version string for this webservice
//
composer.unauthorized.get(/\/version/, function () {
  this.res.json(200, { version: 'composer ' + composer.version });
});

//
// Setup the `union` server through `flatiron.plugins.http`
// and then later add routes.
//
// This webservice users two routers:
//
// * `composer.router`: All routes which require authorization.
// * `composer.unauthorized`: All routes which do not require authorization.
//
composer.use(flatiron.plugins.http, {
  headers: {
    'x-powered-by': 'composer ' + composer.version
  },
  before: [
    function (req, res) {
      function onError(err) {
        //
        // TODO: Something on `err.headers`
        //

        this.res.json(err.status || 500, err.body || new Error('Unhandled error'));
      }

      function notFound(err) {
        if (err.status !== 404) {
          onError.call(this, err);
        }
      }

      if (!composer.unauthorized.dispatch(req, res, notFound)) {
        res.emit('next');
      }
    }
  ]
});

//
// TODO: Flatiron should also check for `database`.
//
composer.use({
  name: 'set-resourceful',
  init: function (done) {
    this.config.set('resourceful', this.config.get('database'));
    done();
  }
});

//
// Use the `resourceful` plugin
//
composer.use(flatiron.plugins.resourceful, {
  engine: 'couchdb',
  dir: path.join(__dirname, 'composer', 'resources')
});

//
// Use the `flatiron-http-users` plugin for user 
// and permission resources.
//
composer.config.set('user:require-activation', false);
composer.use(require('flatiron-http-users'));

//
// Use the `restful` plugin.
//
composer.use(require('restful'));

//
// Use `keys` plugin (TODO: make it not a plugin.)
//
composer.use(composer._plugins.keys);
