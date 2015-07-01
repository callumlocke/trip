# trip.js [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

**trip** is a very simple task runner. You write functions in a tripfile and run them from the command line.

---

# install

```sh
$ npm install --global trip
```

(You might also want to install a local copy with `--save` to lock down the version for your project.)

---

# use

**1. Create a `tripfile.js` and export some tasks**

```js
exports.greet = function () {
  console.log('hello world');
};
```

(You can also use `tripfile.babel.js`, `tripfile.coffee`, or [whatever](https://github.com/tkellen/js-interpret#extensions).)

**2. run tasks from the command line**

```sh
$ trip greet
```


## running multiple tasks

Just run `$ trip first second third` to run as many functions as you want.

(If you have a common sequence you run a lot, use subtasks.)


## subtasks

A task can be defined as an **array** of subtasks:

```js
exports.build = ['first', 'second', 'third'];
```

Now you can do `$ trip build` to run those three tasks in series.

You can also mix **inline functions** (as literals or references) directly into an array of subtasks:

```js
exports.things = [
  'foo',

  function () {
    console.log('this runs between foo and bar');
  },

  'bar'
];
```


## async tasks

If you want to do something asynchronous in any task, return a promise. Trip will wait till it resolves before moving onto the next task in the sequence.

<!-- NOT VERIFIED
(Tip: if you're using a `tripfile.babel.js` and you opt to enable stage 0 transformations via a `.babelrc` file, then you can even just export async functions as tasks, for the nicest possible async flow control.)
-->

## parallel tasks

Use a **nested array** if you want to run certain subtasks in parallel:

```js
exports.build = [ ['one', 'two'], 'three' ];
```

Now `$ trip build` will run tasks `one` and `two` in parallel, then it will finally run `three`.

> Each level of nesting reverses the series:parallel decision, so you can do complex, over-engineered stuff if you want. Probably only useful in obscure cases.

<!-- NOT YET IMPLEMENTED...
### task flags

You can set boolean flags using **colons** as delimiters:

```sh
$ trip say:otters:ducks
```

```js
exports.say = function (options) {
  console.log(options); // {otters: true, ducks: true}
};
```
-->

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
