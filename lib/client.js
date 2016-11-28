'use strict';

var Base = require('base');
var extend = require('extend-shallow');
var last = require('array-last');

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

Base.extend(Client);

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
        cb(null, val);
      };

      resultsRef.on('child_added', handler);
    })
    .catch(cb);
};

module.exports = Client;
