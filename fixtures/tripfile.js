'use strict';

var Promise = require('bluebird');

exports['say-thing-2'] = function () {
  return Promise.delay(150).then(function () {
    console.log('thing 2');
  });
};

exports['say-thing-1'] = function () {
  return Promise.delay(100).then(function () {
    console.log('thing 1');
  });
};

exports.err = function () {
  throw new Error('shit');
};


// expected order: 1,2,3,4
exports['parallel-subtasks'] = [
  'say-thing-1',

  [
    function () {
      return Promise.delay(200).then(function () {
        console.log('thing 3');
      });
    },

    'say-thing-2' // takes 150ms
  ],

  function () {
    return Promise.delay(50).then(function () {
      console.log('thing 4');
    });
  }
];


// exports['task-arguments'] = [
//   function (msg1, msg2) {
//     setTimeout(function () {
//       console.log('action 1', msg1, msg2);
//       done();
//     }, 100);
//   },

//   function (msg, done) {
//     console.log('action 2', msg);
//     done();
//   }
// ];


exports['smoke-test'] = function () {
  var path = require('path');
  console.assert(
    this === require(path.resolve(__dirname, '..', '..')),
    '`this` in a task is trip'
  );
};
