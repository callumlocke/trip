# trip

A very small task runner.

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

trip is like a stripped-down version of [gulp](https://github.com/gulpjs/gulp). All build functionality is removed, leaving just a little API for registering functions that you can run from the command line. The idea is to piece together your own build system using regular Node.js modules.

Another difference from gulp is that everything runs in **series by default** – but you can opt to run things in parallel by wrapping them in an array.


## Getting started

Install trip globally to get the CLI: `$ npm install -g trip`

Then, whenever you want to use trip in a project:

1. Install a local trip in the project folder.

```sh
$ npm install --save-dev trip
```

2. Create a `tripfile.js` and write some tasks.

```js
trip.task('mytask', function () {
  console.log('simples');
});
```

(You can also use `tripfile.coffee` and other dialects supported by [interpret](https://github.com/tkellen/node-interpret).)

Then you run your tasks like this:

```sh
$ trip mytask
```


## Registering tasks

`trip.task(name, action1[, action2...])`

The first argument is the name, followed by one or more **actions**.

An action can be:

- a function,
- the name of another task, or
- an array of actions to be run **in parallel**.

Example:

```js
var trip = require('trip');

// a simple task that prints 'foo'
trip.task('foo', function () {
  console.log('foo');
});

// an async task that waits 500ms then prints 'bar'
trip.task('bar', function (done) {
  setTimeout(function () {
    console.log('this is bar!');
    done();
  }, 500);
});

// a task that runs the above two tasks in parallel
trip.task('together', ['bar', 'foo']);

// a longer example...
trip.task('complex', ['bar', 'foo'], 'sheep', someFunc, ['cats', 'dogs', someOtherFunc]); // see below
```

The `'complex'` task in the above example does these things in order:

1. runs the tasks `bar` and `foo` in parallel
2. runs a task called `sheep`
3. runs the function `someFunc`
4. runs the tasks `cats`, `dogs` and also the function `someOtherFunc` in parallel


## Errors

If you pass any non-null value to `done` as its first argument, this is interpreted as an error, and the action is deemed to have failed. Subsequent actions will not be run and the process will exit with code 1.

For synchronous actions (functions that don't take a `done` argument), just `throw` any error.


## Task input

> This is an experimental feature.

Tasks can optionally receive input (e.g. a filename), either from the command line or from the previous task in a sequence. Instead of coming through as a function argument, it is available as `this.input` (because arguments are already used for other purposes).

Example use case: a `styles` task that renders Sass to CSS. It could render `src/*.scss` by default, but if you call it with a file name, it could just render that specific file.

### From the command line

```sh
$ trip foo:someinput
```

Then, in the `foo` task's first action, `this.input` will be the string `"someinput"`. (NB. the input is always a string when set from the command line.)

### From task to task

```js
trip.task('foo',
  function (done) {
    console.log('action 1');
    done(null, {bread: 'cool'});
  },

  function (done) {
    console.log('action 2');
    console.log(this.input.bread);
    done();
  }
);
```

In this example, running `$ trip foo` will print:

```
action 1
action 2
cool
```

For synchronous actions (functions that don't take a `done` argument), if you want to pass a value to the next task, just `return` it.


## License

[The MIT License](http://opensource.org/licenses/MIT)


[npm-url]: https://npmjs.org/package/trip
[npm-image]: https://badge.fury.io/js/trip.png

[travis-url]: http://travis-ci.org/callumlocke/trip
[travis-image]: https://secure.travis-ci.org/callumlocke/trip.png?branch=master

[depstat-url]: https://david-dm.org/callumlocke/trip
[depstat-image]: https://david-dm.org/callumlocke/trip.png
