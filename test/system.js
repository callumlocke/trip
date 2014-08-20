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


  it('can run actions in series and parallel', function (done) {
    exec(cliPath + ' parallel-actions', function (err, stdout, stderr) {
      console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
      console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

      var lines = stdout.split('\n').filter(function (line) {
        return line.length && line.charAt(0) !== '[';
      });

      expect(lines[0]).to.equal('thing 1');
      expect(lines[1]).to.equal('thing 2');
      expect(lines[2]).to.equal('thing 3');
      expect(lines[3]).to.equal('thing 4');
      expect(stderr).to.equal('');
      done();
    });
  });


  it('actions can receive targets from cli and from previous actions', function (done) {
    exec(cliPath + ' task-input:"from command line":"hi"', function (err, stdout, stderr) {
      console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
      console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

      var lines = stdout.split('\n').filter(function (line) {
        return line.length && line.charAt(0) !== '[';
      });

      expect(lines[0]).to.equal('action 1 from command line hi'); // can receive params from cli
      expect(lines[1]).to.equal('action 2 message from action 1'); // can receive params from previous task
      expect(stderr).to.equal('');
      done();
    });
  });


  it ('can run parallel actions straight from the command line', function (done) {
    exec(cliPath + ' say-thing-1,say-thing-2', function (err, stdout, stderr) {
      console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
      console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

      var lines = stdout.split('\n').filter(function (line) {
        return line.length && line.charAt(0) !== '[';
      });

      expect(lines[0]).to.equal('thing 1'); // can receive params from cli
      expect(lines[1]).to.equal('thing 2'); // can receive params from previous task
      expect(stderr).to.equal('');
      done();
    });
  });

});
