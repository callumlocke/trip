# trip

Run JavaScript functions from the command line.

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

trip is a minimalist task runner. Sort of like [gulp](http://gulpjs.com/) or [grunt](http://gruntjs.com/) without any build functionality. Or a glorified `$ npm run`.

It doesn't include utilities for reading/writing files. The idea is to write your own build system using regular Node modules – trip is just a way to organise your tasks and run them from your terminal – in series or parallel (or combinations of the two).



## install

```sh
$ npm install --global trip
```



## usage

### basic steps

#### 1. install a local copy of trip in your project

```sh
$ cd some/project
$ npm install --save-dev trip
```

#### 2. create a `tripfile.js` and export some functions

```js
var coffee = require('coffee-script'),
    sass = require('node-sass'),
    fs = require('fs'),
    Imagemin = require('imagemin'),
    glob = require('glob');

exports.scripts = function (done) {
  var js = coffee.compile(fs.readFileSync('app/scripts/main.coffee'));
  fs.writeFile('dist/scripts/main.js', js, done);
};

exports.styles = function (done) {
  sass.renderFile({
    file: 'app/scripts/main.scss',
    outFile: 'dist/scripts/main.css',
    success: function (file) {
      console.log('rendered', file);
      done();
    },
    error: done
  });
};

exports.images = function (done) {
  glob('app/**/*.{png,jpg}', function (err, files) {
    if (err) return done(err);

    async.each(files, function (file, done) {
      var im = new Imagemin()
        .src(file)
        .dest(file.replace('app', 'dist'))
        .optimize(done);
    }, done);
  })
};

exports.inline = function (done) {
  var embedder = new ResourceEmbedder(fs.readFileSync('app/index.html'));
  embedder.get(function (markup) {
    fs.writeFileSync('dist/index.html', markup);
  });
};
```

#### 3. run tasks from the command line

```sh
$ trip scripts styles images inline
```

This will run the four named tasks in series (one after the other).


### tasks are asynchronous

You are expected to take a `done` argument, and call it when you're done. This allows trip to move on to the next task in the series, if any. To indicate that your task failed, call `done(error)` – this will halt trip.

<!-- NOT IMPLEMENTED
If you prefer, you can write a synchronous task by explicitly returning `true` from the function. (For errors, just `throw`.) Any other return value is ignored. -->


### subtasks

Use an **array** to make subtasks:

```js
exports.build = ['scripts', 'styles', 'images', 'inline'];
```

Now you can do `$ trip build` to run all four tasks (in series).

You can also use **functions** (or function references) directly in the array, or a mixture of functions and strings:

```js
exports.things = [
  'thing1',

  function (done) {
    console.log('thing 2');
    done();
  },

  'thing3'
];
```

### parallel tasks

#### from the CLI

Join tasks with **commas** to run them in parallel:

```sh
$ trip styles,scripts,images inline
```

This runs the `styles`, `scripts` and `images` tasks in parallel, then – when they've all finished – it runs the `inline` task.

#### parallel subtasks

Use a **nested array** to run tasks in parallel:

```js
exports.build = [['styles', 'scripts', 'images'], 'inline'];
```

Now `$ trip build` should be a lot faster. (As above, it will wait for the first three parallel tasks to finish before running `inline`.)

Each level of nesting reverses the series:parallel decision, so you can do really weird, over-engineered stuff if you want.


### task targets

Targets are a way for tasks to accept arguments.

Example use case: you write a `styles` task that, by default, compiles all your `*.scss` files. But you also accept an optional filename target, so you can opt to compile just a single file, depending on how you call the task.

#### setting targets from the command line

You can pass target strings straight from the command line, using **colons** as delimiters:

```sh
trip say:pigs:otters
```

```js
exports.say = function (msg1, msg2, done) {
  console.log('1:', msg1); // "1: pigs"
  console.log('2:', msg2); // "2: otters"
  done();
};
```


#### setting targets from one task to the next

(This might be useful in some weird situations.)

If you have a series of tasks (that are running either via comma-joined task names in the CLI, or as part of a subtask series), then it's possible for one task to specify target(s) for the next task – whatever that next task might be.

```sh
$ trip taskOne taskTwo
```

```js
exports.taskOne = function (done) {
  done(null, 'pigs', 'otters'); // 1st argument must be an error or null,
                                // subsequent arguments are targets for the next task
};

exports.taskTwo = function (msg1, msg2, done) {
  console.log('1:', msg1); // prints "1: pigs"
  console.log('2:', msg2); // prints "2: otters"
  done();
};
```



## License

[The MIT License](http://opensource.org/licenses/MIT)


[npm-url]: https://npmjs.org/package/trip
[npm-image]: https://badge.fury.io/js/trip.png

[travis-url]: http://travis-ci.org/callumlocke/trip
[travis-image]: https://secure.travis-ci.org/callumlocke/trip.png?branch=master

[depstat-url]: https://david-dm.org/callumlocke/trip
[depstat-image]: https://david-dm.org/callumlocke/trip.png
