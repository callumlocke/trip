# trip.js [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

**trip** is a simple task runner. You write functions in a tripfile and run them from the command line.

---

# install

```sh
$ npm install --global trip
```

---
# use

**1. Create a `tripfile.js` and export some tasks**

Follow Node's standard async pattern – take a `done` callback, and call it when you're done. (And pass it an error if something went wrong.).

```js
exports.greet = function (done) {
  console.log('hi');

  setTimeout(function () {
    console.log('bye');
    done();
  }, 2000);
};
```

**2. run tasks from the command line**

![Screenshot](screenshots/greet.png)


## example tripfile

This tripfile exports four tasks (`scripts`, `styles`, `images` and `inline`):

```js
exports.scripts = function (done) {
  var fs = require('fs');
  var coffee = require('coffee-script');

  fs.readFile('app/scripts/main.coffee', function (err, js) {
    if (err) return done(err);

    var js = coffee.compile();
    fs.writeFile('dist/scripts/main.js', js, done);
  });
};

exports.styles = function (done) {
  var sass = require('node-sass');

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
  var glob = require('glob');
  var Imagemin = require('imagemin')

  glob('app/**/*.{png,jpg}', function (err, files) {
    if (err) return done(err);

    async.each(files, function (file, done) {
      new Imagemin()
        .src(file)
        .dest(file.replace('app', 'dist'))
        .optimize(done);
    }, done);
  });
};

exports.inline = function (done) {
  var ResourceEmbedder = require('resource-embedder');

  new ResourceEmbedder('app/index.html').get(function (markup) {
    fs.writeFile('dist/index.html', markup, done);
  });
};
```

With this tripfile, you can run `$ trip images` to compile all your images, for example.

You can also do `$ trip scripts styles images inline` to perform all four named tasks. To avoid typing all that every time, use **subtasks**.

### subtasks

A task can be defined as an **array** of other tasks:

```js
exports.build = ['scripts', 'styles', 'images', 'inline'];
```

Now you can do `$ trip build` to run all four tasks, in series.

You can also use **inline functions** directly in an array:

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

Use a **nested array** to run subtasks in parallel:

```js
exports.build = [ ['styles', 'scripts', 'images'], 'inline' ];
```

Now `$ trip build` will run the first three tasks in parallel, then it will run `inline`.

> Each level of nesting reverses the series:parallel decision, so you can do complex, over-engineered stuff if you want. Probably only useful in obscure cases.

### task arguments

You can set arguments (only strings) using **colons** as delimiters:

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

Note only two arguments were specified, so `msg3` is `null`. The `done` callback is always passed as the last argument that your function accepts.

---
# licence

[The MIT License](http://opensource.org/licenses/MIT)

<!-- badge URLs -->
[npm-url]: https://npmjs.org/package/trip
[npm-image]: https://img.shields.io/npm/v/trip.svg?style=flat-square

[travis-url]: http://travis-ci.org/callumlocke/trip
[travis-image]: https://img.shields.io/travis/callumlocke/trip.svg?style=flat-square

[depstat-url]: https://david-dm.org/callumlocke/trip
[depstat-image]: https://img.shields.io/david/callumlocke/trip.svg?style=flat-square
