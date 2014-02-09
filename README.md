# Middlewarify

Middleware pattern implementation, robust, easy, fast. You can add two types of middleware, a single queue type using the keyword `use()` or a Before/After type using `before()` and `after()` hooks. All middleware accept promises or vanilla callbacks and final resolution is done using the Promises/A+ spec.

[![Build Status](https://travis-ci.org/thanpolas/middlewarify.png)](https://travis-ci.org/thanpolas/middlewarify)

[![NPM](https://nodei.co/npm/middlewarify.png?downloads=true&stars=true)](https://nodei.co/npm/middlewarify/)


## Install

```shell
npm install middlewarify --save
```

## Quick Start

### Quick Start Example

Creating a middleware:

```js
var midd = require('middlewarify');

var tasks = module.exports = {};

// this is the main callback of your middleware,
// it will be the last callback to be invoked.
function createTask() {
  console.log('createTask Final Fn to be invoked');
}

// Make the'create' Middleware Container.
midd.make(tasks, 'create', createTask);
```

...Add middleware

```js
// ... somewhere far far away in another file

var tasks = require('./tasks');

// add middleware to the 'create' operation

tasks.create.use(function(){
  console.log('middleware 1');
});

// add a second middleware to the 'create' operation
// this time use a promise to indicate asynchronicity
tasks.create.use(function() {
  return new Promise(resolve, reject) {
    console.log('middleware 2');
    resolve();
  });
});


```

... Invoke all the middleware

```js
// ... Invoking them all together
tasks.create();
// prints
// middleware 1
// middleware 2
// createTask Final Fn to be invoked
```

Invoking the middleware will return a Promise, use the `then` function to determine all middleware including the final function invoked successfully:

```js
tasks.create().then(function() {
  // all middleware finished.
}, function(err) {
  // Middleware failed
});
```

#### Using the Before / After Middleware type

To use the Before/After hook types all you need to do is pass an option to Middlewarify's `make()` method.

```js
var midd = require('middlewarify');

var tasks = module.exports = {};

// This is the main callback of your middleware,
// it will be invoked after all 'before' middleware finish
// and before any 'after' middleware.
function createTask() {
    console.log('Invoked Second');
};

// Make the'create' Middleware Container using before/after hooks
midd.make(tasks, 'create', createTask, {beforeAfter: true});

/** ... */

// add a before hook
tasks.create.before(function() {
    console.log('Invoked First');
});

// add an after hook
tasks.create.after(function() {
    console.log('Invoked Third and last');
});

/** ... */

// invoke all middleware
tasks.create().then(function(){
  // at this point all middleware have finished.
}, function(err) {
  // handle error
});

```

## Middlewarify Methods

### make(object, property, optMainCallback, optOptions)

The `middlewarify.make()` method will apply the middleware pattern to an Object's property, this property will be called the *Middleware Container*.

```js
// create a Middleware Container
var crud = {};
middlewarify.make(crud, 'create');
```

This example has created the Middleware Container `create` in the object `crud`. `crud.create()` is a function that will invoke all the middleware.

You can pass a third argument, the `optMainCallback`, a Function. This can be considered the main payload of your middleware. 

`optOptions` defines behavior. Both `optOptions` and `optMainCallback` are optional and can be interswitched, i.e. you can pass options as a third argument, read on for examples and what are the available options.

#### make() Options

`make()` accepts the following options:

* `beforeAfter` type: **Boolean**, default: `false` If set to true the Before/After hooks will be used instead of the single queue `use` hook, which is the default, view the [example displayed above](#using-the-before--after-middleware-type).

#### The use(fn) Method

The Middleware Container by default exposes a `use` hook so you can add any number of middleware. `use()` accepts any number of parameters as long they are of type Function or Array of Functions. When the Before/After flag is enabled `use` is no longer there and instead you get `before` and `after` hooks. All three hook types accept the same argument types and patterns as described bellow.

```js
// create the Middleware Container
var crud = {};
middlewarify.make(crud, 'create', fnFinal);

// add 3 middleware functions
crud.create.use([fn1, fn2], fn3);

// then add another one
crud.create.use(fn4);
```

In the above example we added 4 middleware before the final method `fnFinal` will be invoked. A FIFO queue is implemented so the order of execution will be:

1. `fn1()`
2. `fn2()`
3. `fn3()`
4. `fn4()`
5. `fnFinal()`

#### Middleware Arguments

All middleware get invoked with the arguments that the *Middleware Container* was invoked with. The same number or arguments, the exact same references.

```js
app.connect.use(function(req) {
    req.a === 1; // true
    req.a++;
});
app.connect.use(function(req) {
    req.a === 2; // true
});

app.connect({a:1});

```

#### Asynchronous Middleware Using Promises

You can return a Promise from your middleware and Middlewarify will wait for its resolution before passing control to the next one.

```js
crud.create.before(function() {
    return new Promise(resolve, reject) {
        // do something async...
        resolve();
    });
});
```

#### Invoking the Middleware

The Middleware Container is nothing but a function that accepts any number of arguments.

Any argument passed to the Middleware Container will also be passed to all middleware.

```js
var crud = {};
middlewarify.make(crud, 'create');

// run all middleware
crud.create({a: 1, b:2}, 'bar');
```

Arguments middleware will get:

```js
crud.create.use(function(arg1, arg2, next) {
    arg1 === {a:1, b:2}; // true

    arg2 === 'bar'; // true

    next();
});
```

#### Getting the Middleware Results and Error Handling

When invoked, the *Middleware Container* returns a promise, with it you can check for ultimate execution outcome.

```js
crud.create(arg1, arg2, fn1).then(function() {
    // all cool...
}, function(err) {
    // ops, handle error
    return console.error(err);
});
```
## Release History
- **v0.3.0**, *09 Feb 2014*
    - Removed callback API, 100% Promise based API now.
- **v0.2.0**, *08 Feb 2014*
    - Major API change, introduced Promises to API.
- **v0.1.0**, *28 Jan 2014*
    - Added Before/After feature
    - Reorganized tests
- **v0.0.4**, *10 Oct 2013*
    - Added option to not throw errors
- **v0.0.3**, *02 Aug 2013*
    - Added a more explicit way to declare callbacks when invoking the middleware.
- **v0.0.2**, *15 JuL 2013*
    - Big Bang

## License
Copyright 2013 Thanasis Polychronakis

Licensed under the [MIT License](LICENSE-MIT)

[grunt]: http://gruntjs.com/
[Getting Started]: https://github.com/gruntjs/grunt/wiki/Getting-started
[Gruntfile]: https://github.com/gruntjs/grunt/wiki/Sample-Gruntfile "Grunt's Gruntfile.js"
[grunt-replace]: https://github.com/erickrdch/grunt-string-replace "Grunt string replace"
[grunt-S3]: https://github.com/pifantastic/grunt-s3 "grunt-s3 task"
[thanpolas]: https://github.com/thanpolas "Thanasis Polychronakis"
