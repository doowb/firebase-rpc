'use strict';

var Base = require('base');
var last = require('array-last');
var extend = require('extend-shallow');

// from `firebase.database.ServerValue.TIMESTAMP`
var TIMESTAMP = {'.sv': 'timestamp'};

/**
 * Create a client instance that adds tasks to a [firebase-queue][] and listens for results.
 *
 * ```js
 * var config = {
 *   ref: firebase.database().ref('path/to/rpc')
 * };
 *
 * var client = new Client(config);
 * ```
 * @param {Object} `config` Configuration object containing the [firebase][] database reference and additional options to configure the client.
 * @param {Object} `config.ref` [firebase][] database reference specifying where firebase-rpc should store information ([firebase-queue][] and function results)
 * @api public
 */

function Client(config) {
  if (!(this instanceof Client)) {
    return new Client(config);
  }

  Base.call(this);
  this.is('client');
  this.config = extend({}, config);
  if (!this.config.ref) {
    throw new Error('expected `config.ref` to be a firebase reference.');
  }

  this.queueRef = this.config.ref.child('queue');
}

/**
 * Extend Base
 */

Base.extend(Client);

/**
 * Connect to the [firebase][] database by setting up client metadata to let the server know if this client
 * is connected or not. When the client disconnects, the metadata is removed. This is called in the [run][#run] method to
 * ensure the client is connected before trying to execute any functions.
 *
 * ```js
 * client.connect();
 * ```
 *
 * @api public
 */

Client.prototype.connect = function() {
  if (this.connected) return;
  this.connected = true;

  this.clientRef = this.config.ref.child('clients').push();
  this.id = last(this.clientRef.toString().split('/'));

  this.resultsRef = this.config.ref.child('results/' + this.id);
  this.clientRef.update({
    id: this.id,
    status: 'connected',
    lastActivity: TIMESTAMP
  });

  this.clientRef.onDisconnect().remove();
  this.resultsRef.onDisconnect().remove();
};

/**
 * Run the specified server side task given the specified data and wait for the results.
 *
 * ```js
 * client.run('foo', {foo: 'bar'}, function(err, results) {
 *   if (err) return console.error(err);
 *   console.log(results);
 *   //=> {foo: 'BAR'}
 * });
 * ```
 * @param  {String} `name` Name of the task to run on the server. Task must already be registered with the server.
 * @param  {Object} `data` Optional data to pass to the server side task for running.
 * @param  {Function} `cb` Callback function to be called when the server returns with results.
 * @api public
 */

Client.prototype.run = function(name, data, cb) {
  this.connect();

  if (typeof data === 'function') {
    cb = data;
    data = {};
  }

  var task = {
    client: this.id,
    task: name,
    data: data
  };

  var tasksRef = this.queueRef.child('tasks');
  var resultsRef = this.resultsRef;
  var updates = {};

  var taskRef = tasksRef.push();
  var key = last(taskRef.toString().split('/'));
  task.key = key;

  updates[`clients/${this.id}/lastActivity`] = TIMESTAMP;
  updates[`queue/tasks/${key}`] = task;

  this.config.ref.update(updates)
    .then(function() {
      function handler(snap) {
        if (snap.val().key !== key) {
          return;
        }

        var val = snap.val();
        resultsRef.off('child_added', handler);
        resultsRef.child(snap.key).remove();

        if (val.error) {
          cb(new Error(val.error));
        } else {
          cb(null, val.data || {});
        }
      };

      resultsRef.on('child_added', handler);
    })
    .catch(cb);
};

/**
 * Expose Client
 */

module.exports = Client;
