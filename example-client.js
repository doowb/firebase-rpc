'use strict';

var Client = require('./').Client;

var firebase = require('firebase-admin');
firebase.initializeApp({
  credential: firebase.credential.cert(require('./config.json')),
  databaseURL: "https://fir-rpc-example.firebaseio.com"
});

var config = {
  ref: firebase.database().ref('rpc-example')
};

var client = new Client(config);

var tasks = ['foo', 'bar', 'baz'];
var timeouts = [500, 1000, 2000, 5000];

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function run() {
  var task = random(tasks);
  var timeout = random(timeouts);
  client.run(task, {timeout: timeout}, function(err, results) {
    console.log();
    if (err) return console.error(err);
    console.log(results);
  });
}

setInterval(run, 2000);
