/*
 * index.js: Top-level include for the common module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var os = require('os'),
    spawn = require('child_process').spawn,
    util = require('util'),
    flatiron = require('flatiron');

//
// **REALLY DONT DO THIS HERE! But where?**
//
if (!Error.prototype.toJSON) {
  Object.defineProperty(Error.prototype, "toJSON", {
    enumerable: false,
    value: function () {
      return flatiron.common.mixin({
        message: this.message,
        stack: this.stack,
        arguments: this.arguments
      }, flatiron.common.clone(this));
    }
  });
}

var common = module.exports = flatiron.common.mixin({}, flatiron.common);

common.auth = require('./auth');

//
// ### function showWelcome (mode, ipAddress, port)
// #### @mode {string} The mode that nodejitsu is currently running in.
// #### @ipAddress {string} The IP Address / host that nodejitsu is binding to.
// #### @port {int} The port that nodejitsu is binding to.
// Prints the signature `nodejitsu` welcome message using the colors module.
//
common.showWelcome = function (ipAddress, port) {
  util.puts('');
  util.puts('     ___  ____  _______ ____  ____  ____  ____  ____'.red);
  util.puts('    /    /   / /  /  / /___/ /   / /___  /___  /___/'.red);
  util.puts('   /___ /___/ /  /  / /     /___/ ____/ /___  /  \\'.red);
  util.puts('\n              © 2010 Nodejitsu Inc.');
  util.puts('      All Rights Reserved - www.nodejitsu.com\n');

  util.puts('composer '.red + 'has started ' + 'successfully'.green + ' @ ' + ipAddress.magenta + ' on port ' + port.toString().magenta + '...');
};

//
// ### function ipAddress (name)
// #### @name {string} **Optional** Name of the network interface
// Returns the address for the network interface on the current
// system with the specified `name`. If no interface or `IPv4`
// family is found return the loopback addres `127.0.0.1`.
//
common.ipAddress = function (name) {
  var interfaces = os.networkInterfaces();
  
  var addresses = Object.keys(interfaces).map(function (nic) {
    var addrs = interfaces[nic].filter(function (details) {
      return details.address !== '127.0.0.1' && details.family === 'IPv4'
    });
    return addrs.length ? addrs[0].address : undefined;
  }).filter(Boolean);
  
  return addresses.length
    ? addresses[0]
    : '127.0.0.1';
};
