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

cli.on('require', function (name) {
  console.log('Requiring external module', chalk.magenta(name));
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
    // taskName is something like "foo:hi,bar" or just "foo:hi"
    // or even just "foo"

    async.each(taskName.split(','), function (taskName, done) {
      // now taskName is something like "foo:hi" or just "foo" (ie,
      // definitely a single task)

      // split out any targets
      var initialTargets = taskName.split(':');
      taskName = initialTargets.shift();

      // run the single task
      (function runNamedTask(taskName, targets, done) {
        var taskStart = process.hrtime();

        // the targets need to get applied to the task's first action only.
        trip.log(chalk.cyan(taskName), chalk.gray('started'));

        // function to run an array of stuff
        var runActionArray = function (actions, inSeries, _targets, done) {

          if (inSeries) {
            async.eachSeries(actions, function (action, done) {
              // make a unique local targets array to be applied to this action
              var targets = [].concat(_targets);

              if (Array.isArray(action)) {
                // go deeper..
                runActionArray(action, !inSeries, targets, done);
                // (nb. we don't try to get output targets from an array)
                return;
              }

              var actionDone = function () {
                // this wraps done, also setting the shared _targets array.
                var nextTargets = Array.prototype.slice.call(arguments, 0);
                var err = nextTargets.shift();
                _targets = nextTargets;

                done.call(null, err);
              };

              var type = typeof action;

              if (type === 'string') {
                runNamedTask(action, targets, actionDone);
                return;
              }

              if (type === 'function') {
                action.apply(trip, targets.concat([actionDone]));
                return;
              }

              done(new TypeError('Unexpected type for task action: ' + type));

            }, done);
          }
          else {
            // this repeats a lot from the async.eachSeries just above, but
            // the subtle differences make it more hassle than it's worth to
            // combine them into one. maybe.

            async.each(actions, function (action, done) {
              var targets = [].concat(_targets);

              if (Array.isArray(action)) {
                runActionArray(action, !inSeries, targets, done);
                return;
              }

              var type = typeof action;

              if (type === 'string') {
                runNamedTask(action, targets, done);
                return;
              }

              if (type === 'function') {
                action.apply(trip, targets.concat([done]));
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
        runActionArray(actions, true, targets, function (err) {
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

      })(taskName, initialTargets, done);

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
      trip.log(chalk.red('there were errors'));
      process.exit(1);
    }
  });
});
