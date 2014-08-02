'use strict';

var async = require('async');
var chalk = require('chalk');
var prettyHRTime = require('pretty-hrtime');

var trip = {
  tasks: {},

  task: function (name) {
    trip.tasks[name] = Array.prototype.slice.call(arguments, 1);
  },

  run: function (taskName, input, done) {
    trip.resolveAction(taskName, input)(done);
  },

  resolveAction: function (taskName, _input) {

    return function (done) {
      trip.log(chalk.cyan(taskName), chalk.gray('started'));
      var start = process.hrtime();

      var actions = trip.tasks[taskName];
      if (!actions) return done(
        new Error('Task not registered: "' + taskName + '"')
      );

      // resolve actions into an array of callables
      actions = actions.map(function (action, i) {
        if (Array.isArray(action)) {
          return function (done) {
            async.parallel(action, done);
          };
        }

        var type = typeof action;

        if (type === 'function') return action;

        if (type === 'string') return trip.resolveAction(action);

        throw new TypeError(
          'Unexpected type for action #' + (i + 1) + ' of task "' + taskName +
          '": ' + type
        );
      });

      // add index number to each action, in case needed for error logging
      actions.forEach(function (action, i) {
        action._tripIndex = i;
      });

      // carry out actions in series, with input
      var input = _input;
      async.eachSeries(actions, function (action, done) {
        var context = {input: input};

        if (!action.length) {
          input = action.call(context);
          done();
        }
        else {
          var doneCalled = false;

          action.call(context, function (err, nextInput) {
            if (doneCalled) throw new Error(
              'Action #' + (action._tripIndex + 1) + ' of task "' + taskName +
              '"" called done() more than once'
            );
            doneCalled = true;

            if (err) return done(err);

            input = nextInput;
            done();
          });
        }
      }, function (err) {
        if (err) {
          trip.log(
            chalk.cyan(taskName),
            chalk.red('✘ error'),
            chalk.gray(prettyHRTime(process.hrtime(start)))
          );
        }
        else {
          trip.log(
            chalk.cyan(taskName),
            chalk.gray('✓', prettyHRTime(process.hrtime(start)))
          );
        }

        done.apply(null, arguments);
      });
    };
  },


  log: function () {
    console.log(
      chalk.gray('[trip]'),
      Array.prototype.slice.call(arguments).join(' ')
    );
  }
};

module.exports = trip;
