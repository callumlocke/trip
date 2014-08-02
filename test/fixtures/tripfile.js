'use strict';

var trip = require('../..');

trip.task('parallel-actions',
  function (done) {
    setTimeout(function () {
      console.log('thing 1');
      done();
    }, 100);
  },

  [
    function (done) {
      setTimeout(function () {
        console.log('thing 3');
        done();
      }, 200);
    },
    function (done) {
      setTimeout(function () {
        console.log('thing 2');
        done();
      }, 100);
    },
  ],

  function (done) {
    setTimeout(function () {
      console.log('thing 4');
      done();
    }, 100);
  }
);


trip.task('task-input',
  function (done) {
    console.log('action 1', this.input);
    done(null, 'info from action 1');
  },

  function (done) {
    console.log('action 2', this.input);
    done();
  }
);


trip.task('sync-actions',
  function () {
    console.log('action 1', this.input);
    return 'info from action 1';
  },

  function () {
    console.log('action 2', this.input);
  }
);
