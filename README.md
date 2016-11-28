# firebase-rpc [![NPM version](https://img.shields.io/npm/v/firebase-rpc.svg?style=flat)](https://www.npmjs.com/package/firebase-rpc) [![NPM downloads](https://img.shields.io/npm/dm/firebase-rpc.svg?style=flat)](https://npmjs.org/package/firebase-rpc)

> Asynchronously execute remote functions through firebase.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save firebase-rpc
```

## Usage

### Server

```js
// using `firebase-admin` for example, but this may be `firebase`
var firebase = require('firebase-admin');

// initialize firebase using the server credentials file from your firebase console
firebase.initializeApp({
  credential: require('./config.json'),
  databaseURL: 'your-firebase-url.firebaseio.com'
});

// create a firebase reference to pass to the server for storing queues and data
var ref = firebase.database.ref('path/to/my/ref');

var Server = require('firebase-rpc').Server;
var server = new Server({ref: ref});

// Add some tasks
// These are `composer` tasks and follow the same conventions as `assemble`, `generate`, and `verb`
server.task('foo', function(cb) {
  // data passed in from the client is on the `this.options` object
  var foo = this.options.foo || 'foo';
  cb(null, {foo: foo.toUpperCase()});
});

server.task('bar', function(cb) {
  // data passed in from the client is on the `this.options` object
  var bar = this.options.bar || 'bar';
  cb(null, {bar: bar.toUpperCase()});
});

// start listening to the task queue tasks to execute
server.listen();
```

### Client

```js
// using `firebase-admin` for example, but this may be the `firebase` web api
var firebase = require('firebase-admin');

// Initialize firebase using the server credentials file from your firebase console (use the web config if using in a web browser)
firebase.initializeApp({
  credential: require('./config.json'),
  databaseURL: 'your-firebase-url.firebaseio.com'
});

// Create a firebae reference to pass to the client. This should be the same reference the server is using
var ref = firebase.database.ref('path/to/my/ref');

var Client = require('firebase-rpc').Client;
var client = new Client({ref: ref});

// run a task
client.run('foo', {foo: 'this is foo'}, function(err, results) {
  if (err) return console.error(err);
  console.log(results);
  //=> { foo: 'THIS IS FOO' }
});
```

## API

### [Server](lib/server.js#L25)

Create a server instance that creates a [firebase-queue](https://github.com/firebase/firebase-queue) instance to use for executing remote functions. Remote functions may be added to the server instance or through built-in commands from a client.

**Example**

```js
var config = {
  ref: firebase.database().ref('path/to/rpc')
};

var server = new Server(config);
```

**Params**

* `config` **{Object}**: Configuration object containing the [firebase](https://firebase.google.com/) database reference and additional options to configure the server.
* `config.ref` **{Object}**: [firebase](https://firebase.google.com/) database reference specifying where firebase-rpc should store information ([firebase-queue](https://github.com/firebase/firebase-queue) and function results)
* `config.queue` **{Object}**: Additional [firebase-queue](https://github.com/firebase/firebase-queue) options to specify the number of workers and schemas to use (See [firebase-queue](https://github.com/firebase/firebase-queue) for available options)

### [.listen](lib/server.js#L61)

Start listening by creating a [firebase-queue](https://github.com/firebase/firebase-queue) instance.

**Example**

```js
server.listen();
```

**Params**

* `options` **{Object}**: Additional options to override default [firebase-queue](https://github.com/firebase/firebase-queue) options passed into the constructor.
* `returns` **{Object}**: Instance of [firebase-queue](https://github.com/firebase/firebase-queue);

### [Client](lib/client.js#L25)

Create a client instance that adds tasks to a [firebase-queue](https://github.com/firebase/firebase-queue) and listens for results.

**Example**

```js
var config = {
  ref: firebase.database().ref('path/to/rpc')
};

var client = new Client(config);
```

**Params**

* `config` **{Object}**: Configuration object containing the [firebase](https://firebase.google.com/) database reference and additional options to configure the client.
* `config.ref` **{Object}**: [firebase](https://firebase.google.com/) database reference specifying where firebase-rpc should store information ([firebase-queue](https://github.com/firebase/firebase-queue) and function results)

### [.connect](lib/client.js#L58)

Connect to the [firebase](https://firebase.google.com/) database by setting up client metadata to let the server know if this client is connected or not. When the client disconnects, the metadata is removed. This is called in the [run][#run] method to ensure the client is connected before trying to execute any functions.

**Example**

```js
client.connect();
```

### [.run](lib/client.js#L92)

Run the specified server side task given the specified data and wait for the results.

**Example**

```js
client.run('foo', {foo: 'bar'}, function(err, results) {
  if (err) return console.error(err);
  console.log(results);
  //=> {foo: 'BAR'}
});
```

**Params**

* `name` **{String}**: Name of the task to run on the server. Task must already be registered with the server.
* `data` **{Object}**: Optional data to pass to the server side task for running.
* `cb` **{Function}**: Callback function to be called when the server returns with results.

## About

### Related projects

* [assemble](https://www.npmjs.com/package/assemble): Get the rocks out of your socks! Assemble makes you fast at creating web projects… [more](https://github.com/assemble/assemble) | [homepage](https://github.com/assemble/assemble "Get the rocks out of your socks! Assemble makes you fast at creating web projects. Assemble is used by thousands of projects for rapid prototyping, creating themes, scaffolds, boilerplates, e-books, UI components, API documentation, blogs, building websit")
* [composer](https://www.npmjs.com/package/composer): API-first task runner with three methods: task, run and watch. | [homepage](https://github.com/doowb/composer "API-first task runner with three methods: task, run and watch.")
* [firebase-cron](https://www.npmjs.com/package/firebase-cron): Store and run cron jobs with firebase. | [homepage](https://github.com/doowb/firebase-cron "Store and run cron jobs with firebase.")
* [generate](https://www.npmjs.com/package/generate): Command line tool and developer framework for scaffolding out new GitHub projects. Generate offers the… [more](https://github.com/generate/generate) | [homepage](https://github.com/generate/generate "Command line tool and developer framework for scaffolding out new GitHub projects. Generate offers the robustness and configurability of Yeoman, the expressiveness and simplicity of Slush, and more powerful flow control and composability than either.")
* [verb](https://www.npmjs.com/package/verb): Documentation generator for GitHub projects. Verb is extremely powerful, easy to use, and is used… [more](https://github.com/verbose/verb) | [homepage](https://github.com/verbose/verb "Documentation generator for GitHub projects. Verb is extremely powerful, easy to use, and is used on hundreds of projects of all sizes to generate everything from API docs to readmes.")

### Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

Please read the [contributing guide](contributing.md) for avice on opening issues, pull requests, and coding standards.

### Building docs

_(This document was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme) (a [verb](https://github.com/verbose/verb) generator), please don't edit the readme directly. Any changes to the readme must be made in [.verb.md](.verb.md).)_

To generate the readme and API documentation with [verb](https://github.com/verbose/verb):

```sh
$ npm install -g verb verb-generate-readme && verb
```

### Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

### Author

**Brian Woodward**

* [github/doowb](https://github.com/doowb)
* [twitter/doowb](http://twitter.com/doowb)

### License

Copyright © 2016, [Brian Woodward](https://github.com/doowb).
Released under the [MIT license](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.2.0, on November 28, 2016._