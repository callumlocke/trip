/*jshint maxlen:120*/
/*global describe, before, it*/

'use strict';

var path = require('path');
var fs = require('fs');
var expect = require('chai').expect;
var exec = require('child_process').exec;
var strip = require('stripcolorcodes');

describe('trip', function () {

  var cliPath = path.resolve(__dirname, '..', 'cli.js');

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


  it('can run subtasks in series and parallel', function (done) {
    exec(cliPath + ' parallel-subtasks', function (err, stdout, stderr) {
      console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
      console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

      var lines = strip(stdout).split('\n').filter(function (line) {
        return line.length && line.charAt(0) !== '[';
      });

      console.log('LINES', lines);

      expect(lines[0]).to.equal('thing 1');
      expect(lines[1]).to.equal('thing 2');
      expect(lines[2]).to.equal('thing 3');
      expect(lines[3]).to.equal('thing 4');
      expect(stderr).to.equal('');
      done();
    });
  });


  it('first action can receive arguments from cli', function (done) {
    exec(cliPath + ' task-arguments:"from command line":"hi"', function (err, stdout, stderr) {
      console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
      console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

      var lines = stdout.split('\n').filter(function (line) {
        return line.length && line.charAt(0) !== '[';
      });

      expect(lines[0]).to.equal('action 1 from command line hi'); // can receive params from cli
      expect(lines[1]).to.equal('action 2 null'); // should not have anything passed
      expect(stderr).to.equal('');
      done();
    });
  });


  // it('can run parallel tasks straight from the command line', function (done) {
  //   exec(cliPath + ' say-thing-1,say-thing-2', function (err, stdout, stderr) {
  //     console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
  //     console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

  //     var lines = stdout.split('\n').filter(function (line) {
  //       return line.length && line.charAt(0) !== '[';
  //     });

  //     expect(lines[0]).to.equal('thing 1'); // can receive params from cli
  //     expect(lines[1]).to.equal('thing 2'); // can receive params from previous task
  //     expect(stderr).to.equal('');
  //     done();
  //   });
  // });


  it('tasks expecting arguments still work when not all arguments are specified', function (done) {
    exec(cliPath + ' task-arguments:thing', function (err, stdout, stderr) {
      console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
      console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

      var lines = stdout.split('\n').filter(function (line) {
        return line.length && line.charAt(0) !== '[';
      });

      expect(lines[0]).to.equal('action 1 thing null');
      expect(lines[1]).to.equal('action 2 null');
      expect(stderr).to.equal('');
      done();
    });
  });


  // it('errors when you overload a task', function (done) {
  //   exec(cliPath + ' task-arguments:one:two:three:four', function (err, stdout, stderr) {
  //     console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
  //     console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

  //     expect(err).to.be.an.instanceOf(Error);

  //     var lines = stdout.split('\n').filter(function (line) {
  //       return line.indexOf('Function expects 2 arguments') !== -1;
  //     });

  //     expect(lines.length).to.equal(1);

  //     done();
  //   });
  // });



  it('basic things are true', function (done) {
    exec(cliPath + ' smoke-test', function (err, stdout, stderr) {
      console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
      console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

      expect(stderr).to.equal('');
      done();
    });
  });
});
