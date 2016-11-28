'use strict';

var extend = require('extend-shallow');
var runtimes = require('base-runtimes');
var Server = require('./').Server;

var firebase = require('firebase-admin');
firebase.initializeApp({
  credential: firebase.credential.cert(require('./config.json')),
  databaseURL: "https://fir-rpc-example.firebaseio.com"
});

var config = {
  ref: firebase.database().ref('rpc-example'),
  numWorkers: 3
};

var server = new Server(config);
server.use(runtimes());

server.task('foo', function(cb) {
  var opts = extend({timeout: 200}, this.options);
  setTimeout(function() {
    cb(null, {foo: 'foo'});
  }, opts.timeout);
});

server.task('bar', function(cb) {
  var opts = extend({timeout: 200}, this.options);
  setTimeout(function() {
    cb(null, {bar: 'bar'});
  }, opts.timeout);
});

server.task('baz', function(cb) {
  var opts = extend({timeout: 200}, this.options);
  setTimeout(function() {
    cb(null, {baz: 'baz'});
  }, opts.timeout);
});

server.listen();
console.log('server listening');
