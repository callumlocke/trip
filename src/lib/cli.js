/* eslint-disable no-process-exit */

import {red, gray, yellow, cyan} from 'chalk';
import Liftoff from 'liftoff';
import {jsVariants} from 'interpret';
import tildify from 'tildify';
import prettyHRTime from 'pretty-hrtime';
import minimist from 'minimist';
import v8flags from 'v8flags';
import semver from 'semver';
import clearTrace from 'clear-trace';
import {join} from 'path';
import {existsSync} from 'fs';

const argv = minimist(process.argv.slice(2));
const quiet = (argv.quiet || argv.q);

const cliPackage = require('../../package.json');


const cli = new Liftoff({
  name: 'trip',
  extensions: jsVariants,
});

cli.on('requireFail', (name, error) => {
  if (error.message.substring(0, 19) === 'Cannot find module ') {
    console.error(red('\nFailed to load external module: ' + name));

    console.error(
      `\nBecause of your tripfile's extension, trip tried to import the external\nmodule ` +
      cyan(name) + ', but it was not found.'
    );

    const hasPackageJSON = existsSync(join(argv.cwd || process.cwd(), 'package.json'));

    console.error(
      '\nYou could try: \n\n  ' + gray('$ ') + cyan(
        'npm install ' +
        (hasPackageJSON ? '--save-dev ' : '') +
        name.split('/')[0]
      ) + '\n'
    );

    process.exit(1);
  }

  else throw error;
});

cli.launch({
  cwd: argv.cwd,
  v8flags: v8flags,
  configPath: argv.file,
}, async function (env) {
  if (!quiet) console.log('');

  if (!env.configPath) {
    console.error(red('no tripfile found'));
    process.exit(1);
  }

  // load the local version of trip if available, otherwise this one
  const trip = require(env.modulePath || './index').default;

  // disable trip.log if necessary
  if (quiet) trip._quiet = true;

  // Check for semver difference between cli and local installation
  if (semver.gt(cliPackage.version, env.modulePackage.version)) {
    trip.log(red('Warning: trip version mismatch:'));
    trip.log(red('Global trip is', cliPackage.version));
    trip.log(red('Local trip is', env.modulePackage.version));
  }

  // change directory if necessary, and warn about it
  if (env.configBase !== process.cwd()) {
    trip.log(yellow('cd ' + tildify(env.configBase)));
    process.chdir(env.configBase);
  }

  // load the user's tripfile and populate trip.tasks
  (() => {
    let tripfile = require(env.configPath);

    // ensure they're all arrays
    for (const name of Object.keys(tripfile)) {
      if (!Array.isArray(tripfile[name])) {
        tripfile[name] = [tripfile[name]];
      }
    }

    trip.tasks = tripfile;
  })();



  // run each cli-initiated task, in series
  const taskNames = argv._;
  if (taskNames.length === 0) taskNames[0] = 'default';

  process.on('uncaughtException', function (err) {
    let type;
    if (err instanceof Error) type = 'error';
    else type = typeof err;

    trip.log(red(type + ' thrown:'));
    console.error(clearTrace(err), '\n');
    process.exit(1);
  });


  process.on('unhandledRejection', function (err) {
    trip.log(red('unhandled rejection:'));
    console.error(clearTrace(err), '\n');
    process.exit(1);
  });

  process.on('exit', function () {
    if (trip._running > 0) {
      trip.log(red(`one or more tasks didn't finish`));
      process.exit(1);
    }
  });



  const start = process.hrtime();
  let failed = false;

  try {
    for (const taskName of taskNames) {
      // taskName is something like "foo" or "foo:hi".

      // split out any flags TODO
      // const cliArguments = taskName.split(':');
      // taskName = cliArguments.shift();

      await trip.run(taskName);
    }
  }
  catch (err) {
    failed = true;

    if (err.message && err.message.indexOf('task not found') === 0) {
      console.error(red(err.message));

      console.error(gray('\navailable tasks:\n'));

      for (const taskName of Object.keys(trip.tasks)) {
        console.error('  ' + cyan(taskName));
      }
      console.error('');
    }
    else {
      console.error('  ' + clearTrace(err).split('\n').join('\n  '));
      console.error('');
    }
  }

  trip.log(gray('total: ' + prettyHRTime(process.hrtime(start))));

  if (failed) process.exit(1);

  // exiting successfully now.
});
