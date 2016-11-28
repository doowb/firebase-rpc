'use strict';

var Base = require('base');
var tasks = require('base-task');
var extend = require('extend-shallow');
var Queue = require('firebase-queue');

/**
 * Create a server instance that creates a [firebase-queue][] instance to use for executing remote functions.
 * Remote functions may be added to the server instance or through built-in commands from a client.
 *
 * ```js
 * var config = {
 *   ref: firebase.database().ref('path/to/rpc')
 * };
 *
 * var server = new Server(config);
 * ```
 * @param {Object} `config` Configuration object containing the [firebase][] database reference and additional options to configure the server.
 * @param {Object} `config.ref` [firebase][] database reference specifying where firebase-rpc should store information ([firebase-queue][] and function results)
 * @param {Object} `config.queue` Additional [firebase-queue][] options to specify the number of workers and schemas to use (See [firebase-queue][] for available options)
 * @api public
 */

function Server(config) {
  if (!(this instanceof Server)) {
    return new Server(config);
  }

  Base.call(this);
  this.isApp = true;
  this.is('server');
  this.config = extend({}, config);
  if (!this.config.ref) {
    throw new Error('expected `config.ref` to be a firebase reference.');
  }

  this.queueOpts = extend({}, this.config.queue);
  this.queueRef = this.config.ref.child('queue');

  this.use(tasks());
}

Base.extend(Server);

Server.prototype.listen = function(options) {
  var opts = extend(this.queueOpts, options);
  this.queue = new Queue(this.queueRef, opts, this.process.bind(this));
};

Server.prototype.process = function(data, progress, resolve, reject) {
  if (data && data.task) {
    var self = this;
    var client = data.client;
    var key = data.key;

    var resultsRef = this.config.ref.child('results/' + client);

    // skip running the task if the client disconnected
    this.isConnected(client, function(err, connected) {
      if (err) return reject(err);
      if (!connected) return resolve();

      // run the task
      self.build(data.task, (data.data || {}), function(err, result) {

        // skip returning the results if the client disconnected
        self.isConnected(client, function(err2, connected) {
          if (err2) return reject(err2);
          if (!connected) return resolve();

          var results = {client: client, key: key};
          if (err) {
            results.error = err;
          } else {
            results.data = result;
          }

          resultsRef.push(results)
            .then(function() {
              resolve();
            })
            .catch(reject);
        });
      });
    });
    return;
  }
  resolve();
};

Server.prototype.isConnected = function(client, cb) {
  var clientRef = this.config.ref.child('clients/' + client);
  clientRef.once('value', function(snap) {
    if (snap.val() !== null) {
      return cb(null, true);
    }
    cb(null, false);
  });
};

module.exports = Server;
