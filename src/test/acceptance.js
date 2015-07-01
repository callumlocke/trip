import {chmodSync, mkdirSync, symlinkSync} from 'fs';
import cp from 'child_process';
import {resolve} from 'path';
import {expect} from 'chai';
import Promise from 'bluebird';

const exec = Promise.promisify(cp.exec);

(async () => {
  console.log('testing trip...');

  const cliPath = resolve(__dirname, '..', '..', 'cli.js');

  // preparation
  {
    chmodSync(cliPath, '777');

    // cd to the fixtures dir
    const fixturesDir = resolve(__dirname, '..', '..', 'fixtures');
    process.chdir(fixturesDir);

    // symlink fixtures/node_modules/trip back to `..`
    const fixtureModules = resolve(fixturesDir, 'node_modules');
    try { mkdirSync(fixtureModules); }
    catch (err) { if (err.code !== 'EEXIST') throw err; }

    const linkPath = resolve(fixtureModules, 'trip');
    try { symlinkSync(resolve(__dirname, '..'), linkPath); }
    catch (err) { if (err.code !== 'EEXIST') throw err; }
  }


  // first test
  {
    console.log('can run subtasks in series and parallel');

    const [stdout, stderr] = await exec(cliPath + ' parallel-subtasks');
    console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
    console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

    const lines = stdout.split('\n')
      .filter(line => line.length && line.charAt(0) !== '[');

    console.log('LINES', lines);

    expect(lines[0]).to.equal('thing 1');
    expect(lines[1]).to.equal('thing 2');
    expect(lines[2]).to.equal('thing 3');
    expect(lines[3]).to.equal('thing 4');
    expect(stderr).to.equal('');
  }


  // it('first action can receive arguments from cli', function (done) {
  //   exec(cliPath + ' task-arguments:"from command line":"hi"', function (err, stdout, stderr) {
  //     console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
  //     console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

  //     var lines = stdout.split('\n').filter(function (line) {
  //       return line.length && line.charAt(0) !== '[';
  //     });

  //     expect(lines[0]).to.equal('action 1 from command line hi'); // can receive params from cli
  //     expect(lines[1]).to.equal('action 2 null'); // should not have anything passed
  //     expect(stderr).to.equal('');
  //     done();
  //   });
  // });


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


  // it('tasks expecting arguments still work when not all arguments are specified', function (done) {
  //   exec(cliPath + ' task-arguments:thing', function (err, stdout, stderr) {
  //     console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
  //     console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

  //     var lines = stdout.split('\n').filter(function (line) {
  //       return line.length && line.charAt(0) !== '[';
  //     });

  //     expect(lines[0]).to.equal('action 1 thing null');
  //     expect(lines[1]).to.equal('action 2 null');
  //     expect(stderr).to.equal('');
  //     done();
  //   });
  // });


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



  // it('basic things are true', function (done) {
  //   exec(cliPath + ' smoke-test', function (err, stdout, stderr) {
  //     console.log('\n\n=== STDOUT:\n', stdout, '\n=== /STDOUT');
  //     console.log('\n\n=== STDERR:', stderr, '\n=== /STDERR');

  //     expect(stderr).to.equal('');
  //     done();
  //   });
  // });

})();
