'use strict';

exports['say-thing-2'] = function (done) {
  setTimeout(function () {
    console.log('thing 2');
    done();
  }, 150);
};

exports['say-thing-1'] = function (done) {
  setTimeout(function () {
    console.log('thing 1');
    done();
  }, 100);
};


// expected order: 1,2,3,4
exports['parallel-actions'] = [
  'say-thing-1',

  [
    function (done) {
      setTimeout(function () {
        console.log('thing 3');
        done();
      }, 200);
    },

    'say-thing-2' // takes 150ms
  ],

  function (done) {
    setTimeout(function () {
      console.log('thing 4');
      done();
    }, 50);
  }
];


exports['task-input'] = [
  function (msg1, msg2, done) {
    setTimeout(function () {
      console.log('action 1', msg1, msg2);
      done(null, 'message from action 1');
    }, 100)
  },

  function (msg, done) {
    console.log('action 2', msg);
    done();
  }
];
