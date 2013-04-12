/*
 * keys.js: Adds additional routes for the listing all keys.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var composer = require('../../composer');

//
// Name this plugin
//
exports.name = 'keys';

//
// ### function attach()
// Adds additional routes for the listing all keys.
//
exports.attach = function () {
  //
  // Setup routes for the `/keys` resource which lists
  // keys for all users or an individual user.
  //
  composer.router.path('/keys', function () {
    //
    // List Keys: GET to `/keys` returns list of all public keys
    //            for all users.
    //
    this.get(function () {
      var res = this.res;
      composer.resources.User.keys(function (err, keys) {
        return err
          ? res.json(500, err)
          : res.json(200, { keys: keys });
      });
    });

    //
    // List Keys: GET to `/keys/:username` returns the value
    //            of the CouchDB attachment.
    //
    this.get(/\/([\w\-\_\.]+)/, function (id, keyname) {
      var res = this.res;

      composer.resources.User.keys(id, function (err, keys) {
        return err
          ? res.json(500, err)
          : res.json(200, { keys: keys });
      });
    });
  });
};