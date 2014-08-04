/*jshint maxlen:120*/
/*global describe, before, it*/

'use strict';

var path = require('path');
var fs = require('fs');
var expect = require('chai').expect;
var exec = require('child_process').exec;

describe('trip.js', function () {
  var cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js');

  before(function (done) {
    fs.chmodSync(cliPath, '777');

    // change to the fixtures dir
    var fixturesDir = path.resolve(__dirname, 'fixtures');
    process.chdir(path.resolve(__dirname, 'fixtures'));

    // symlink fixtures/node_modules/trip back to `..`
    var fixtureModules = path.resolve(fixturesDir, 'node_modules');
    try { fs.mkdirSync(fixtureModules); }
    catch (err) { if (err.code !== 'EEXIST') throw err; }

    var linkPath = path.resolve(fixtureModules, 'trip');
    try { fs.symlinkSync(path.resolve(__dirname, '..'), linkPath); }
    catch (err) { if (err.code !== 'EEXIST') throw err; }

    done();
  });

  it('can run actions in parallel', function (done) {
    exec(cliPath + ' parallel-actions', function (err, stdout, stderr) {
      console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
      console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

      var lines = stdout.split('\n');
      expect(lines[2]).to.equal('thing 1');
      expect(lines[3]).to.equal('thing 2');
      expect(lines[4]).to.equal('thing 3');
      expect(lines[5]).to.equal('thing 4');
      expect(stderr).to.equal('');
      done();
    });
  });

  it('actions can receive input from cli and from previous actions', function (done) {
    exec(cliPath + ' task-input:"from command line"', function (err, stdout, stderr) {
      console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
      console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

      var lines = stdout.split('\n');
      expect(lines).to.include('action 1 from command line'); // can receive params from cli
      expect(lines).to.include('action 2 info from action 1'); // can receive params from previous task
      expect(stderr).to.equal('');
      done();
    });
  });


  it('actions can be synchronous, and handle input', function (done) {
    exec(cliPath + ' sync-actions:"from command line"', function (err, stdout, stderr) {
      console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
      console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

      var lines = stdout.split('\n');
      expect(lines).to.include('action 1 from command line'); // can receive params from cli
      expect(lines).to.include('action 2 info from action 1'); // can receive params from previous task
      expect(stderr).to.equal('');
      done();
    });
  });
});
