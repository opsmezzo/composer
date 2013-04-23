# composer [![Build Status](https://secure.travis-ci.org/opsmezzo/composer.png)](http://travis-ci.org/opsmezzo/composer)

A configuration management and package management server that supports OS and infrastructure opacity. **This is the backend for `quill`**.

## Running Conservatory

To run `composer` you simply need to run the `bin/composer` binary:

``` bash
$ bin/composer

     ___  ____  _______ ____  ____  ____  ____  ____
    /    /   / /  /  / /___/ /   / /___  /___  /___/
   /___ /___/ /  /  / /     /___/ ____/ /___  /  \

              © 2010 Nodejitsu Inc.
      All Rights Reserved - www.nodejitsu.com

composer has started successfully @ 192.168.1.106 on port 9004...
```

The options to this script are minimal as most configuration is stored in `config/env/*.json`:

``` bash
$ bin/composer --help
usage: composer [options]

options:
  -a                 IP Address that you want the Master to run from [dynamic]
  -p                 Port that you want the composer to run on       [9004]
  -e [env]           The environment to the specified command in     [development]
  -c, --config       File to use for required configuration values   [config/env/development.json]
  -h, --help         You're staring at it
```

## Installation

`composer` can be installed from `npm`.

``` bash
  $ npm install composer-server -g
```

## Tests
All tests are written with [vows][0] and intended to be run with [npm][1]:

``` bash
  $ npm test
```

#### Author: [Nodejitsu Inc][2]
#### Contributors: [Charlie Robbins](http://github.com/indexzero), [Maciej Malecki](http://github.com/mmalecki)

[0]: http://vowsjs.org
[1]: http://npmjs.org
[2]: http://nodejitsu.com