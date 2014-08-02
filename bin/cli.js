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

  // run the user's tripfile
  require(env.configPath);

  // run each cli-initiated task, in series
  var tasks = argv._;
  if (tasks.length === 0) tasks = ['default'];

  var start = process.hrtime();

  async.eachSeries(tasks, function (task, done) {
    var parts = task.split(':');
    task = parts.shift();
    var input = parts.join('') || null;

    trip.resolveAction.call(null, task, input)(done);

  }, function (err, nextInput) {

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
