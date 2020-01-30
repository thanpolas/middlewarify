# Middlewarify

Middleware pattern implementation, robust, easy, fast. You can add two types of middleware, a single queue type using the keyword `use()` or a Before/After type using `before()` and `after()` hooks. All middleware accept promises or vanilla callbacks and final resolution is done using the Promises/A+ spec.

[![Build Status](https://travis-ci.org/thanpolas/middlewarify.png)](https://travis-ci.org/thanpolas/middlewarify)

[![NPM](https://nodei.co/npm/middlewarify.png?downloads=true&stars=true)](https://nodei.co/npm/middlewarify/)


## Install

```shell
npm install middlewarify --save
```

## Documentation

### Quick Start Example

Creating a middleware:

```js
const middlewarify = require('middlewarify');

const tasks = module.exports = {};

// this is the main callback of your middleware,
// it will be the last callback to be invoked.
function createTask(data) {
  console.log('createTask Final Fn to be invoked');
  
  /** do something with "data" ... */

  return true;
}

// Make the'create' Middleware Container.
middlewarify.make(tasks, 'create', createTask);
```

...Add middleware

```js
// ... somewhere far far away in another file

const tasks = require('./tasks');

// add middleware to the 'create' operation

tasks.create.use(function(data) {
  console.log('middleware 1');
  data.newAttr = 2;
});

// add a second middleware to the 'create' operation
// this time use a promise to indicate asynchronicity
tasks.create.use(function(data) {
  return new Promise(function(resolve, reject) {
    console.log('middleware 2. Title:', data.title);
    data.secondAttr = 3;
    resolve();
  });
});
```

... Invoke all the middleware

```js
// ... Invoking them all together
tasks.create(data)
// prints:
// middleware 1
// middleware 2
// createTask Final Fn to be invoked
    .then(function(result) {
        console.log(result);
        // prints: true
    });
```

Invoking the middleware will return a Promise, use the `then` function to determine all middleware including the final function invoked successfully:

```js
tasks.create(data).then(function(result) {
  // all middleware finished.
}, function(err) {
  // Middleware failed
});
```

You may also use Async/Await:

```js
try {
    const result = await tasks.create(data);
} catch (ex) {
    // handle error.
}
```

### Using the Before / After / Last Middleware types

To use the Before/After/Last hook types all you need to do is pass the `{beforeAfter: true}` option to Middlewarify's `make()` method.

When using the `beforeAfter` option instead of the typical `use()` method three different methods are created on the resulting middleware method:

* `midd.before()` Hook functions to be invoked **before** the main middleware function.
* `midd.after()` Hook functions to be invoked **after** the main middleware function.
* `midd.last()` Hook functions to be invoked **last**, after the main middleware and all middleware functions have been executed.

> All added hooks are invoked in the order they were added.

#### Before / After / Last Middleware Example

```js
const middlewarify = require('middlewarify');

const tasks = module.exports = {};

// This is the main callback of your middleware,
// it will be invoked after all 'before' middleware finish
// and before any 'after' middleware.
function createTask() {
    console.log('Invoked Second');
    return 999;
};

// Make the'create' Middleware Container using before/after hooks
middlewarify.make(tasks, 'create', createTask, {beforeAfter: true});

/** ... */

// add a before hook
tasks.create.before(function() {
    console.log('Invoked First');
});

// add an after hook
tasks.create.after(function() {
    console.log('Invoked Third');
});

// add an always LAST hook, will always invoke last
task.create.last(function() {
    console.log('Will always invoke last');
});

/** ... */

// invoke all middleware
tasks.create().then(function(val){
    // at this point all middleware have finished.
    console.log(val); // 999
}, function(err) {
    // handle error
});
```

## Middlewarify Methods

### make(object, property, optMainCallback, optOptions)

The `middlewarify.make()` method will apply the middleware pattern to an Object's property, this property will be called the *Middleware Container*.

```js
// create a Middleware Container
const crud = {};
middlewarify.make(crud, 'create');
```

This example has created the Middleware Container `create` in the object `crud`. `crud.create()` is a function that will invoke all the middleware.

You can pass a third argument, the `optMainCallback`, a Function. This will be the *Main* callback of your middleware, the result returned, or resolved if a promise is used, will get passed to the final promise:

```js
crud.create().then(function(val) {
    // this is the final promise.
    // val is passed from the Main callback.
});
```

`optOptions` defines behavior. Both `optOptions` and `optMainCallback` are optional and can be interswitched, i.e. you can pass options as a third argument, read on for examples and what are the available options.

#### make() Options

`make()` accepts the following options:

* `beforeAfter` type: **Boolean**, default: `false` If set to true the Before/After hooks will be used instead of the single queue `use` hook, which is the default, view the [example displayed above](#using-the-before--after-middleware-type).
* `catchAll` type **Function**, default: `null` If defined all errors will be piped to this callback, useful when Middleware is used as Express middleware.

#### The use(fn) Method

The Middleware Container by default exposes a `use` hook so you can add any number of middleware. `use()` accepts any number of parameters as long they are of type Function or Array of Functions. When the Before/After flag is enabled `use` is no longer there and instead you get `before` and `after` hooks. All three hook types accept the same argument types and patterns as described bellow.

```js
// create the Middleware Container
const crud = {};
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

All middleware gets invoked with the arguments that the *Middleware Container* was invoked with. The same number or arguments, the exact same references.

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
    return new Promise(function(resolve, reject) {
        // do something async...
        resolve();
    });
});
```

#### Invoking the Middleware

The Middleware Container is nothing but a function that accepts any number of arguments.

Any argument passed to the Middleware Container will also be passed to all middleware.

```js
const crud = {};
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

#### After & Last Hooks get the Result

If your middleware if a Before / After type, then all `.after()` hooks will receive an extra argument representing the resolving value.

```js
middlewarify.make(crud, 'create', function(arg1, arg2) {
    return 'abc';
});

crud.create.after(function(arg1, arg2, val) {
    console.log(val); // prints 'abc'
});

crud.create(1, 2);
```

#### After & Last Hooks can alter the Result

All After & Last hooks may alter the result as long as they return any type of value except `undefined`.

```js
middlewarify.make(crud, 'create', function() {
    return 'abc';
});

crud.create.after(function(result) {
    // return an altered outcome
    return 'def';
});

crud.create().then(function(result) {
    console.log(result); // prints "def"
});
```

## Release History

- **v1.0.1**, *30 Jan 2020*
    - Updated all dependencies to latest.
- **v1.0.0**, *23 Jul 2015*
    - Honorary release.
    - Updated all dependencies to latest.
- **v0.4.0**, *25 Jul 2014*
    - Now After & Last middlewares may alter the result value by returning a non undefined value.
- **v0.3.8**, *24 Jul 2014*
    - Implemented `.last()` middleware type in beforeAfter family.
- **v0.3.7**, *03 Mar 2014*
    - Added `catchAll` option for cases where invocations have no error handlers.
- **v0.3.6**, *02 Mar 2014*
    - Optimizations and better handling of errors.
    - Updated to latest Bluebird, now suppresses unhandled errors.
- **v0.3.4**, *19 Feb 2014*
    - Update dependencies to latest.
- **v0.3.3**, *15 Feb 2014*
    - Resolving value now gets propagated to all `.after()` hooks.
- **v0.3.2**, *09 Feb 2014*
    - Optimize middleware invocation using `Promise.try()`
- **v0.3.1**, *09 Feb 2014*
    - Main Callback now passes value to final promise.
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

Copyright Thanasis Polychronakis, licensed under the [MIT License](LICENSE-MIT).

[grunt]: http://gruntjs.com/
[Getting Started]: https://github.com/gruntjs/grunt/wiki/Getting-started
[Gruntfile]: https://github.com/gruntjs/grunt/wiki/Sample-Gruntfile "Grunt's Gruntfile.js"
[grunt-replace]: https://github.com/erickrdch/grunt-string-replace "Grunt string replace"
[grunt-S3]: https://github.com/pifantastic/grunt-s3 "grunt-s3 task"
[thanpolas]: https://github.com/thanpolas "Thanasis Polychronakis"
