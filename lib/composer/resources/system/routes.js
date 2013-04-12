/*
 * routes.js: RESTful web service for the system resource.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var composer = require('../../../composer'),
    director = require('director'),
    auth = composer.common.auth;

//
// Require authentication for `/systems`
//
composer.router.before(/\/systems/, auth.basicAuth);

//
// Setup the necessary params for complex version and ids
//
composer.router.param('system-name', /([\w|\_|\-|\.]+)/);
composer.router.param('version', /[v=]*(\d+\.\d+\.\d+(-\d+-?)?[a-zA-Z\-]?[\w-\.:]*)/);

//
// Setup RESTful web service for `/systems`.
//
composer.router.path(/\/systems/, function () {
  //
  // If system has `maintainers` array and user wants to change state of the
  // system, verify that he is indeed a maintainer. Otherwise, return 403.
  //
  function verifyMaintainer() {
    var name = arguments[0],
        next = arguments[arguments.length - 1],
        req = this.req,
        res = this.res;

    //
    // Only verify when user is actually changing the system (not for GET or
    // POST requests).
    //
    if (['PUT', 'DELETE'].indexOf(req.method) === -1) {
      return next();
    }

    composer.resources.System.get(name, function (err, system) {
      if (err) {
        //
        // If system wasn't found, hand control off to actual handler.
        // Otherwise, bail out with error.
        //
        return err.error === 'not_found' ? next() : next(err);
      }

      var maintainers = system.maintainers;
      if ((maintainers && maintainers.length && maintainers.indexOf(req.user.username) === -1) &&
          !(req.user.permissions && req.user.permissions.superuser)) {
        return next(new director.http.Forbidden());
      }

      next();
    });
  }

  //
  // List Systems: `GET /systems` returns list of all systems.
  //
  this.get(function () {
    var res = this.res;

    composer.resources.System.all(function (err, systems) {
      if (err) {
        return res.json(500, err);
      }

      res.json(200, { systems: systems });
    });
  });

  //
  // Before PUT|DELETE to any routes under `/system/:system-name`
  // ensure that `this.req.user.username` is a system maintainer.
  //
  this.before('/:system-name', verifyMaintainer);

  //
  // CRUD for system resources.
  //
  this.path('/:system-name', function () {
    //
    // Get System: `GET /systems/:system-name` returns the system.
    //
    this.get(function (id) {
      var res = this.res;

      composer.resources.System.get(id, function (err, system) {
        if (err) {
          return res.json(err.status || err.code || 500, err);
        }

        res.json(200, { system: system });
      });
    });

    //
    // Create System: `POST /systems/:system-name` creates the system
    //
    this.post(function (id) {
      var res = this.res,
          system = this.req.body;

      system._id = system._id || id;
      system.name = system.name || id;
      system.maintainers = system.maintainers || [];

      if (system.maintainers.indexOf(this.req.user.username) === -1) {
        system.maintainers.push(this.req.user.username);
      }

      composer.resources.System.create(system, function (err, system) {
        if (err) {
          return res.json(err.error === 'conflict' ? 409 : 500, err);
        }

        res.json(201, { system: system });
      });
    });

    //
    // Add Version Details: `PUT /systems/:system-name` adds a
    // version to the system
    //
    this.put(function (id) {
      var res = this.res,
          version = this.req.body;

      if (!version.version) {
        return res.json(400, { message: 'Version not specified' });
      }

      composer.resources.System.get(id, function (err, system) {
        if (err) {
          return res.json(err.status || err.code || 500, err);
        }

        system.addVersion(version, function (err) {
          if (err && err.message && /Cannot add existing version/.test(err.message)) {
            return res.json(400, err);
          }

          return err
            ? res.json(500, err)
            : res.json(200);
        });
      });
    });

    //
    // Destroy System: `DELETE /systems/:system-name` destroys the system.
    // **This cannot be undone.**
    //
    this.delete(function (id) {
      var res = this.res;

      composer.resources.System.destroy(id, function (err) {
        if (err && err.reason === 'not_found') {
          return res.json(404, err);
        }

        return err
          ? res.json(500, err)
          : res.json(200);
      });
    });
  });

  //
  // CRUD for system owners
  //
  this.path('/:system-name/owners', function () {
    //
    // Add Owner: `PUT /systems/:system-name/owners` adds all owners
    // in the body to the system maintainers
    //
    this.put(function (name) {
      var res = this.res,
          add = this.req.body;

      if (!Array.isArray(add)) {
        return res.json(400, { message: 'Owners must be an array'});
      }

      composer.resources.System.get(name, function (err, system) {
        if (err) {
          return res.json(err.status || err.code || 500, err);
        }

        system.addOwners(add);
        system.update({ maintainers: system.maintainers }, function (err) {
          return err
            ? res.json(err.code || 500, err)
            : res.json(204);
        });
      });
    });

    //
    // Remove Owner: `DELETE /systems/:system-name/owners` removes
    // all owners in the body from the system maintainers.
    //
    this.delete(function (name) {
      var res = this.res,
          remove = this.req.body;

      if (!Array.isArray(remove)) {
        return res.json(400, { message: 'Owners must be an array'});
      }

      composer.resources.System.get(name, function (err, system) {
        if (err) {
          return res.json(err.status || err.code || 500, err);
        }

        system.removeOwners(remove);
        system.update({ maintainers: system.maintainers }, function (err) {
          return err
            ? res.json(err.code || 500, err)
            : res.json(204);
        });
      });
    });
  });

  //
  // Routes for working with versions: uploads, downloads, json.
  //
  // Remove Conservatory API authentication headers so they are
  // not piped to CouchDB via `request`.
  //
  this.before('/:system-name/:version', function (name, version, _, next) {
    delete this.req.headers['authorization'];
    delete this.req.headers['remote_user'];
    next();
  });

  //
  // CRUD for system versions.
  //
  this.path('/:system-name/:version', function () {
    //
    // Remove Version Details: `DELETE /systems/:system-name/:version` removes
    // the version details for the system.
    //
    this.delete(function (name, version) {
      var res = this.res;

      composer.resources.System.get(name, function (err, system) {
        if (err) {
          return res.json(500, err);
        }

        system.removeVersion(version, function (err) {
          if (err && err.message && /Version not found/.test(err.message)) {
            return res.json(404, err);
          }

          return err
            ? res.json(500, err)
            : res.json(200);
        });
      });
    });

    //
    // Add System Tarball: `PUT /systems/:system-name/:version` adds the tarball
    // attachment to the system and version
    //
    this.put({ stream: true }, function (name, version) {
      var req = this.req,
          res = this.res;

      composer.resources.System.get(name, function (err, system) {
        if (err) {
          return res.json(500, err);
        }

        system.upload(version, req, function (err) {
          if (err && err.message && /Cannot add existing version/.test(err.message)) {
            return res.json(400, err);
          }

          return err
            ? res.json(500, err)
            : res.json(200);
        });
      });
    });

    //
    // Get System Tarball: `Get /systems/:system-name/:version` returns the tarball
    // attachment for the system and version.
    //
    this.get({ stream: true }, function (name, version) {
      var req = this.req,
          res = this.res;

      composer.resources.System.get(name, function (err, system) {
        if (err) {
          return res.json(500, err);
        }

        var stream = system.download(version, function (err, headers) {
          if (err && err.message && /No data for version/.test(err.message)) {
            return res.json(404, err);
          }
          else if (err) {
            return res.json(err.status || 500, err);
          }

          ['etag',
           'content-md5',
           'content-length',
           'content-type',
           'cache-control',
           'accept'].forEach(function (header) {
             res.setHeader(header, headers[header]);
           });

          res.writeHead(200);
          stream.pipe(res);
        });
      });
    });
  })
});
