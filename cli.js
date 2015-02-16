#!/usr/bin/env node
'use strict';

var Liftoff = require('liftoff');
var async = require('async');
var interpret = require('interpret');
var tildify = require('tildify');
var prettyHRTime = require('pretty-hrtime');
var chalk = require('chalk');
var argv = require('minimist')(process.argv.slice(2));
var v8flags = require('v8flags');

var cli = new Liftoff({
  name: 'trip',
  extensions: interpret.jsVariants
});

cli.on('requireFail', function (name) {
  console.log(chalk.red('Failed to load external module:' + name));
  console.log('try: npm install ' + name);
});

cli.launch({
  cwd: argv.cwd,
  v8flags: v8flags,
  configPath: argv.file
}, function (env) {
  console.log(); // deliberate

  if (!env.configPath) {
    console.error(chalk.red('no tripfile found'));
    process.exit(1);
  }

  // load the local version of trip
  var trip = require(env.modulePath || './index');

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
      if (tripfile.hasOwnProperty(name) && !Array.isArray(tripfile[name])) {
        tripfile[name] = [tripfile[name]];
      }
    }

    trip.tasks = tripfile;
  })();



  // run each cli-initiated task, in series
  var taskNames = argv._;
  if (taskNames.length === 0) taskNames[0] = 'default';

  process.on('uncaughtException', function (err) {
    var type;
    if (err instanceof Error) type = 'error';
    else type = typeof err;

    trip.log(chalk.red(type + ' thrown:'));
    console.error(type === 'error' ? err.stack : err, '\n');
  });

  process.on('exit', function () {
    if (trip._running > 0) {
      trip.log(chalk.red('one or more tasks did not call done()'));
      process.exit(1);
    }
  });

  var start = process.hrtime();

  async.eachSeries(taskNames, function (taskName, done) {
    // taskName is something like "foo" or "foo:hi".

    // split out any arguments
    var cliArguments = taskName.split(':');
    taskName = cliArguments.shift();

    trip.run(taskName, cliArguments, done);

  }, function (err, nextInput) {
    // cli tasks have finished running.

    if (err) {
      if (err.message && err.message.indexOf('task not found') === 0) {
        trip.log(chalk.red(err.message));

        console.log(chalk.gray('\navailable tasks:\n'));

        for (var taskName in trip.tasks) {
          if (trip.tasks.hasOwnProperty(taskName)) {
            console.log('  ' + chalk.cyan(taskName));
          }
        }
        console.log('');
      }
      else {
        if (!(err instanceof Error)) {
          trip.log('warning: this is not an instanceof Error:');
          console.log('');
          console.error(err);
          console.log('');
        }
        else {
          // pretty-print error
          console.log('');
          console.error(err.stack); // todo: nicer
          console.log('');
        }
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
      process.exit(1);
    }

    // exiting successfully now.
  });
});
