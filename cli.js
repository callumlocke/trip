#!/usr/bin/env node
'use strict';

var Liftoff = require('liftoff');
var async = require('async');
var interpret = require('interpret');
var tildify = require('tildify');
var prettyHRTime = require('pretty-hrtime');
var chalk = require('chalk');
var argv = require('minimist')(process.argv.slice(2));


var cli = new Liftoff({
  name: 'trip',
  extensions: interpret.jsVariants
});

cli.on('requireFail', function (name) {
  console.log(chalk.red('Failed to load external module'), chalk.magenta(name));
});

cli.launch({
  cwd: argv.cwd
}, function (env) {
  console.log();

  if (!env.configPath) {
    console.error(chalk.red('No tripfile found.'));
    process.exit(1);
  }

  if (!env.modulePath) {
    console.error(chalk.red('No local trip found in ' + env.cwd));
    console.log(chalk.cyan(
      '\nYou need to install trip locally:\n  $ '
    ) + 'npm install --save-dev trip');
    process.exit(1);
  }

  // load the local version of trip
  var trip = require(env.modulePath);

  // change directory if necessary, and warn about it
  if (env.configBase !== process.cwd()) {
    trip.log(chalk.yellow('cd ' + tildify(env.configBase)));
    process.chdir(env.configBase);
  }

  // load the user's tripfile and populate trip.tasks
  (function () {
    var tripfile = require(env.configPath);

    // ensure they're all arrays
    for (var name in tripfile) {
      if (tripfile.hasOwnProperty(name)) {
        if (!Array.isArray(tripfile[name])) tripfile[name] = [tripfile[name]];
      }
    }

    trip.tasks = tripfile;
  })();



  // run each cli-initiated task, in series
  var taskNames = argv._;
  if (taskNames.length === 0) taskNames[0] = 'default';

  var start = process.hrtime();

  async.eachSeries(taskNames, function (taskName, done) {
    // taskName is something like "foo:hi,bar:hi" or just "foo:hi" (or "foo")

    async.each(taskName.split(','), function (taskName, done) {
      // now taskName is something like "foo:hi" or just "foo" (ie,
      // definitely a single task, maybe with arguments)

      // split out any arguments
      var cliArguments = taskName.split(':');
      taskName = cliArguments.shift();

      // run the single task
      (function runNamedTask(taskName, args, done) {
        var taskStart = process.hrtime();

        // the args need to get applied to the task's first action only.
        trip.log(chalk.cyan(taskName), chalk.gray('started'));

        // function to run an array of stuff
        var runActionArray = function (actions, inSeries, _args, done) {

          if (inSeries) {
            async.eachSeries(actions, function (action, done) {
              // make a unique local args array to be applied to this action
              var args = [].concat(_args);

              if (Array.isArray(action)) {
                // go deeper..
                runActionArray(action, !inSeries, args, done);
                // (nb. we don't try to get output args from an array)
                return;
              }

              var actionDone = function () {
                // this wraps done, also setting the shared _args array.
                var nextArgs = Array.prototype.slice.call(arguments, 0);
                console.log('NEXTARGS', nextArgs);
                var err = nextArgs.shift();
                _args = nextArgs;

                done.call(null, err);
              };

              var type = typeof action;

              if (type === 'string') {
                runNamedTask(action, args, actionDone);
                return;
              }

              if (type === 'function') {
                // prevent overloading with extra args as it breaks the
                // automatic callback-at-end functionality
                var numArgs = args.length,
                    numArgsExpected = action.length - 1;

                if (numArgsExpected < 0) {
                  done(new Error(
                    'Function must take a callback as an argument.'
                  ));
                  return;
                }

                if (numArgs > numArgsExpected) {
                  done(new Error(
                    'Function expects ' + numArgsExpected + ' arguments (in ' +
                    'addition to callback), ' + 'but ' + numArgs +
                    ' args were passed from the CLI. ' +
                    'You cannot overload task functions with extra argments.'
                  ));
                  return;
                }

                // pad args with nulls so that callback is guaranteed to be
                // the last argument the user's function accepts
                while (args.length < numArgsExpected)
                  args.push(null);

                // ensure callback is passed to the last one
                action.apply(trip, args.concat([actionDone]));
                return;
              }

              // error
              done(new TypeError('Unexpected type for task action: ' + type));

            }, done);
          }
          else {
            // this repeats a lot from the async.eachSeries just above, but
            // the subtle differences make it more hassle than it's worth to
            // combine them into one. maybe.

            async.each(actions, function (action, done) {
              var args = [].concat(_args);

              if (Array.isArray(action)) {
                runActionArray(action, !inSeries, args, done);
                return;
              }

              var type = typeof action;

              if (type === 'string') {
                runNamedTask(action, args, done);
                return;
              }

              if (type === 'function') {
                action.apply(trip, args.concat([done]));
                return;
              }

              done(new TypeError('Unexpected type for task action: ' + type));
            }, done);
          }
          return;
        };

        // find this task's actions array
        var actions = trip.tasks[taskName];
        if (!actions)
          throw new Error('Task not registered with name: ' + taskName);

        // run the actions array for this named task
        runActionArray(actions, true, args, function (err) {
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
              chalk.gray('✓', prettyHRTime(process.hrtime(taskStart)))
            );
          }

          done.apply(null, arguments);
        }); // todo: add info for logging here?

      })(taskName, cliArguments, done);

    }, done);


  }, function (err, nextInput) {
    // cli tasks have finished running.

    if (err) {
      trip.log(chalk.red(err.toString()));

      if (!(err instanceof Error)) {
        trip.log('Warning: an action returned an error, but it was not an ' +
          'instance of Error. Is the action forgetting to pass null as the ' +
          'first argument to "done"?');
      }
    }

    // warn about any arguments returned by the final action
    if (nextInput != null) {
      trip.log(chalk.red(
        'Warning: unused params from final action in sequence: '
      ));

      console.dir(nextInput);
    }

    trip.log(chalk.gray('total: ' + prettyHRTime(process.hrtime(start))));

    if (err) {
      trip.log(chalk.red('trip encountered errors :('));
      process.exit(1);
    }
  });
});
