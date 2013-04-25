/*
 * routes.js: RESTful web service for the config resource.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var async = require('flatiron').common.async,
    composer = require('../../../composer'),
    auth = composer.common.auth;

//
// Require authentication for `/config`
//
composer.router.before(/\/config/, auth.basicAuth);

//
// Setup params for config and group IDs.
//
composer.router.param('config', /([\w|\_|\-|\.]+)/);
composer.router.param('group',  /([\w|\_|\-|\.]+)/);

//
// Setup RESTful web service for `/config`.
//
composer.router.path(/\/config/, function () {
  //
  // Store the double slash `//...` regular expression
  // for resuse.
  //
  var doubleSlash = /\/{2,}/;

  //
  // List: GET to /config returns list of all configs
  //
  this.get(function () {
    var res = this.res;

    composer.resources.Config.all(function (err, config) {
      if (err) {
        return res.json(500, err);
      }

      res.json(200, { config: config });
    });
  });

  //
  // Get Server Config: `GET /config/servers` responds with
  // an index of server addresses by system and by group and by system.
  //
  this.get('/servers', function () {
    var res = this.res;

    if (!composer.provisioner) {
      return res.json(501, new Error('No provisioner config provided'));
    }

    //
    // Calculate this configuration by performing an inner join
    // on roles and servers.
    //
    // TODO: Calculate this once and cache it listening to the
    // changes feed.
    //
    async.parallel({
      //
      // * List all roles.
      //
      roles: function (next) {
        composer.provisioner.roles.list(function (err, roles) {
          return err ? next(err) : next(null, roles);
        });
      },
      //
      // * List all servers.
      //
      servers: function (next) {
        composer.provisioner.servers.list(function (err, servers) {
          return err ? next(err) : next(null, servers);
        });
      }
    }, function (err, data) {
      if (err) {
        return res.json(err.code || 500, err);
      }

      var systems = data.roles.reduce(function (all, role) {
        all[role.name] = role.systems;
        return all;
      }, {});

      //
      // Respond with the list of server addressed reduced into
      // an index by system and by cluster and by system. e.g.:
      //
      // {
      //   provisioner: [{ public: [], private: [] }],
      //   cluster: {
      //     clusterName: {
      //      provisioner: [{ public: [], private: [] }]
      //     }
      //   }
      // }
      //
      return res.json(200, data.servers.reduce(function (all, server) {
        if (Array.isArray(server.clusters)) {
          server.clusters.forEach(function (cluster) {
            all.clusters[cluster] = all.clusters[cluster] || {};
          });
        }

        if (Array.isArray(systems[server.role])) {
          systems[server.role].forEach(function (system) {
            all[system] = all[system] || [];
            all[system].push(server.addresses);

            if (Array.isArray(server.clusters)) {
              server.clusters.forEach(function (cluster) {
                all.clusters[cluster][system] = all.clusters[cluster][system] || [];
                all.clusters[cluster][system].push(server.addresses);
              });
            }
          });
        }

        return all;
      }, { clusters: {} }));
    });
  });

  //
  // Get Server Config in Cluster: `GET /config/servers/:cluster` responds with
  // an index of server addresses in that cluster by system.
  //
  this.get('/servers/:cluster', function (cluster) {
    var res = this.res;

    if (!composer.provisioner) {
      return res.json(501, new Error('No provisioner config provided'));
    }

    //
    // Calculate this configuration by performing an inner join
    // on roles and servers.
    //
    // TODO: Calculate this once and cache it listening to the
    // changes feed.
    //
    async.parallel({
      //
      // * List all roles.
      //
      roles: function (next) {
        composer.provisioner.roles.list(function (err, roles) {
          return err ? next(err) : next(null, roles);
        });
      },
      //
      // * List all servers in the cluster.
      //
      servers: function (next) {
        composer.provisioner.servers.listCluster(cluster, function (err, servers) {
          return err ? next(err) : next(null, servers);
        });
      },
    }, function (err, data) {
      if (err) {
        return res.json(err.code || 500, err);
      }

      var systems = data.roles.reduce(function (all, role) {
        all[role.name] = role.systems;
        return all;
      }, {});

      //
      // Respond with the list of server addressed reduced into
      // an index by system e.g.:
      //
      // {
      //   provisioner: [{ public: [], private: [] }],
      // }
      //
      return res.json(200, data.servers.reduce(function (all, server) {
        if (Array.isArray(systems[server.role])) {
          systems[server.role].forEach(function (system) {
            all[system] = all[system] || [];
            all[system].push(server.addresses);
          });
        }

        return all;
      }, {}));
    });
  });

  //
  // CRUD for Config resources.
  //
  this.path('/:config', function () {
    //
    // Show: GET /config/:id responds with the config for the specified `:id`.
    //
    this.get(function (id) {
      var res = this.res;

      composer.resources.Config.get(id, function (err, config) {
        if (err) {
          return res.json(500, err);
        }

        res.json(200, { config: config });
      });
    });

    //
    // Create: POST /config/:id creates a config with the specified `:id`.
    //
    this.post(function (id) {
      var res = this.res,
          config;

      if (id === 'servers') {
        return res.json(400, { error: 'servers is a reserved name' });
      }

      config = {
        _id: id,
        name: id,
        settings: this.req.body || {}
      };

      composer.resources.Config.create(config, function (err, config) {
        if (err) {
          return res.json(500, err);
        }

        res.json(201, { config: config });
      });
    });

    //
    // Destroy: DELETE /config/:id destroys the config for the specified `:id`.
    //
    this.delete(function (id) {
      var res = this.res;

      if (id === 'servers') {
        return res.json(400, { error: 'servers is a reserved name' });
      }

      composer.resources.Config.destroy(id, function (err) {
        return err
          ? res.json(500, err)
          : res.json(200);
      });
    });
  });

  //
  // Routes for setting `key value` pairs in the Environment
  // settings
  //
  function validPath(keys, res) {
    if (!keys || doubleSlash.test(keys)) {
      res.json(400, new Error('Bad URL key value: `//...`'));
      return null;
    }

    keys = keys.split('/').filter(Boolean);

    if (!keys.length) {
      res.json(400, new Error('No key provided'));
      return null;
    }

    return keys;
  }

  //
  // Set Key Value Pair: PUT to `/:id/path/to/key` sets the JSON body
  // in the `settings` value of the Environment with the specified `:id`.
  //
  this.put(/\/([\w|\_|\-|\.]+)(.*)/, function (id, keys) {
    var res = this.res,
        value = this.req.body;

    if (id === 'servers') {
      return res.json(400, { error: 'servers is a reserved name' });
    }

    keys = validPath(keys, res);

    if (!keys) {
      return;
    }

    composer.resources.Config.set(id, keys, value, function (err) {
      return err
        ? res.json(500, err)
        : res.json(200);
    });
  });

  //
  // Clear Key Value Pair: DELETE to `/:id/path/to/key` clears the key
  // in the `settings` value of the Environment with the specified `:id`.
  //
  this.delete(/\/([\w|\_|\-|\.]+)(.*)/, function (id, keys) {
    var res = this.res;

    if (id === 'servers') {
      return res.json(400, { error: 'servers is a reserved name' });
    }

    keys = validPath(keys, res);

    if (!keys) {
      return;
    }

    composer.resources.Config.clear(id, keys, function (err) {
      return err
        ? res.json(500, err)
        : res.json(200);
    });
  });
});
