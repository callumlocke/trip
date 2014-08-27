# trip.js [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

**trip** is a minimalist task runner. Sort of like [gulp](http://gulpjs.com/) or [grunt](http://gruntjs.com/) without any build functionality. Or a glorified `$ npm run` with optional parallelism.

It doesn't include utilities for reading/writing files or massaging data. The idea is to write your own build system using regular Node modules.



## install

```sh
$ npm install --global trip
```

This adds trip to your $PATH.


## usage

### getting started

#### 1. install a local copy of trip in your project

```sh
$ cd some/project
$ npm install --save-dev trip
```

#### 2. create a `tripfile.js` at the root of your project

Simply export functions. These are your tasks. Follow the standard Node pattern: take a `done` callback, and call it when you're done. (Pass an error as the first argument to indicate your task failed.)

```js
exports.greet = function (done) {
  console.log('hi');

  setTimeout(function () {
    console.log('bye');
    done();
  }, 2000);
};
```



#### 3. run tasks from the command line

![Screenshot](screenshots/greet.png)




### example

Here is a tripfile that exports four tasks:

```js
var coffee = require('coffee-script'),
    sass = require('node-sass'),
    fs = require('fs'),
    Imagemin = require('imagemin'),
    glob = require('glob');


exports.scripts = function (done) {
  fs.readFile('app/scripts/main.coffee', function (err, js) {
    if (err) return done(err);

    var js = coffee.compile();
    fs.writeFile('dist/scripts/main.js', js, done);
  });
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
  var embedder = new ResourceEmbedder('app/index.html');
  embedder.get(function (markup) {
    fs.writeFile('dist/index.html', markup, done);
  });
};
```

With this tripfile, you can run `$ trip images` to compile all your images, for example.

You can also do `$ trip scripts styles images inline` to perform all four named tasks, in series. To avoid typing all that every time, use **subtasks**.


### subtasks

A task can be defined as an **array** of other tasks:

```js
exports.build = ['scripts', 'styles', 'images', 'inline'];
```

Now you can do `$ trip build` to run all four tasks, in series.

You can also use **inline functions** (or function references) directly in an array, or a mixture of functions and task names:

```js
exports.things = [
  'foo',

  function (done) {
    console.log('this runs between foo and bar');
    done();
  },

  'bar'
];
```

### parallel tasks

#### ...from the CLI

Join tasks with **commas** to run them in parallel:

```sh
$ trip styles,scripts,images inline
```

This runs the `styles`, `scripts` and `images` tasks in parallel then, when they've all finished, it runs the `inline` task.

#### ...in your tripfile

Use a **nested array** to run subtasks in parallel:

```js
exports.build = [['styles', 'scripts', 'images'], 'inline'];
```

Now `$ trip build` does the same thing as the CLI example above, starting `inline` as soon as the three parallel tasks have all completed.

> Each level of nesting reverses the series:parallel decision, so you can do complex, over-engineered stuff if you want. Probably only useful in obscure cases.


### task targets

Targets are arguments for tasks.

#### setting targets from the CLI

You can set targets (only strings) using **colons** as delimiters:

```sh
$ trip say:otters:ducks
```

```js
exports.say = function (msg1, msg2, msg3, done) {
  console.log(msg1); // otters
  console.log(msg2); // ducks
  console.log(msg3); // null
  done();
};
```

Note only two targets were specified, so `msg3` is `null`. This doesn't cause a problem; the `done` callback is always passed as the final argument.

#### setting targets from one task to the next

If you have a series of tasks (either from the command line, or subtasks of another task), it's possible to set targets in one task for the next.

```sh
$ trip taskOne:otters taskTwo
```

```js
exports.taskOne = function (done, msg) {
  done(null, msg, 'ducks'); // 1st argument must be an error or null
};

exports.taskTwo = function (msg1, msg2, done) {
  console.log(msg1); // otters
  console.log(msg2); // ducks
  done();
};
```



## license

[The MIT License](http://opensource.org/licenses/MIT)


<!-- badge URLs -->
[npm-url]: https://npmjs.org/package/trip
[npm-image]: https://badge.fury.io/js/trip.png

[travis-url]: http://travis-ci.org/callumlocke/trip
[travis-image]: https://secure.travis-ci.org/callumlocke/trip.png?branch=master

[depstat-url]: https://david-dm.org/callumlocke/trip
[depstat-image]: https://david-dm.org/callumlocke/trip.png
