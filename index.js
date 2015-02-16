'use strict';

var async = require('async');
var prettyHRTime = require('pretty-hrtime');
var chalk = require('chalk');

var trip = {
  _running: 0,

  log: function () {
    var date = new Date(),
        hh = date.getHours() + '',
        mm = date.getMinutes() + '',
        ss = date.getSeconds() + '';

    if (hh.length < 2) hh = '0' + hh;
    if (mm.length < 2) mm = '0' + mm;
    if (ss.length < 2) ss = '0' + ss;

    console.log(
      chalk.gray('[' + hh + ':' + mm + ':' + ss + ']'),
      Array.prototype.slice.call(arguments).join(' ')
    );
  },

  run: function (taskName, args, done) {
    if (!Array.isArray(args)) {
      // console.log('WARNING args is ' + typeof args, args);
      args = [];
    }

    var actions = trip.tasks[taskName];
    if (!Array.isArray(actions))
      return done(new Error('task not found: "' + taskName + '"'));

    var resolvedActions;
    try {
      resolvedActions = actions.map(function (action, i) {
        // whatever it is, return a function that can be called
        // as an action, i.e. name(arg1, arg2..., done);

        if (Array.isArray(action)) {
          // return func that runs all of the subActions in parallel
          return function (done) {
            // var _args = Array.prototype.slice.call(arguments);
            // var done = _args.pop();

            async.each(action, function (subAction, done) {
              // running one parallel subAction.
              if (Array.isArray(subAction)) {
                return done(new Error('tasks nested too deep.'));
                // or should we run it again?
              }

              switch (typeof subAction) {
              case 'string':
                trip.run(subAction, null, done);
                break;
              case 'function':
                // call with the right number of args
                var subActionArgs = [];
                while (subActionArgs.length < subAction.length - 1)
                  subActionArgs.push(null);
                subActionArgs.push(done);

                // if (subActionArgs.length !== subAction.length) {
                //   return done(
                //     new Error('Cannot overload tasks with extra arguments.')
                //   );
                // }

                subAction.apply(trip, subActionArgs);
                break;
              default:
                done(new TypeError('unexpected type for subtask: ' + typeof subAction));
              }
            }, done);
          };
        }

        // it's a single task - either a string or a function.

        switch (typeof action) {

        case 'function':
          // already a function; just use it directly
          return action;

        case 'string':
          // return a function that will call the string via trip.run()

          return function (/*arg1, arg2..., done*/) {
            var _args = Array.prototype.slice.call(arguments);
            var done = _args.pop();

            trip.run(action, _args, done);
          };

        default:
          throw new TypeError('unexpected type for action ' + i + ' of task');
        }
      });
    } catch (err) {
      done(err);
      return;
    }

    // run all the tasks in series
    var taskStart = process.hrtime();
    trip.log(chalk.cyan(taskName), chalk.gray('started'));
    trip._running++;
    // console.log('NUMBER', resolvedActions.length);

    async.eachSeries(resolvedActions, function (resolvedAction, done) {

      console.assert(typeof resolvedAction === 'function');

      // prepare the args to pass to the task action
      while (args.length < resolvedAction.length - 1) {
        args.push(null);
      }
      args.push(done);

      resolvedAction.apply(trip, args);
      args = []; // so they only get put into the first one

    }, function (err) {
      trip._running--;
      if (err) {
        trip.log(
          chalk.cyan(taskName),
          chalk.red('✘ error'),
          chalk.gray(prettyHRTime(process.hrtime(taskStart)))
        );
      }
      else {
        trip.log(
          chalk.cyan(taskName),
          chalk.green('✓'),
          chalk.gray(prettyHRTime(process.hrtime(taskStart)))
        );
      }

      done(err);
    });
  }
};

module.exports = trip;
