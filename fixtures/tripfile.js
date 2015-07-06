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


exports['list-flags'] = function (flags) {
  console.log('flags are:', Object.keys(flags).join(', '));
};



exports['flags-for-subtasks'] = [
  'say-thing-1',
  'list-flags:x:y:z',
  'say-thing-2',
];

exports['no-subtask-flags-from-cli'] = [
  'list-flags',
  'say-thing-1',
  'say-thing-2',
];


exports['smoke-test'] = function () {
  var path = require('path');
  console.assert(
    this === require(path.resolve(__dirname, '..', '..')),
    '`this` in a task is trip'
  );
};
