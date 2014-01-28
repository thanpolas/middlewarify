# Middlewarify

Apply the middleware pattern easily. You can add two types of middleware, a single queue type using the keyword `use()` for hooking or a before / after type using `before()` and `after()` hooks.

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
function createTask(done) {
  console.log('createTask Final Fn to be invoked');
  done();
}

// Make the'create' Middleware Container.
midd.make(tasks, 'create', createTask);
```

...Add middleware

```js
// ... somewhere far far away in another file

var tasks = require('./tasks');

// add middleware to the 'create' operation

tasks.create.use(function(next){
  console.log('middleware 1');
  next();
});

// add another middleware to the 'create' operation
tasks.create.use(function(next){
  console.log('middleware 2');
  next();
});

```

... Invoke all the middleware

```js
// ... Invoking them all together
tasks.create();
```

Invoking the middleware will return an object with a `done` property which you can use to setup your callbacks:

```js
tasks.create().done(function(err) {
  // all middleware finished.
});
```

#### Using the Before / After Middleware type

```js
var midd = require('middlewarify');

var tasks = module.exports = {};

// This is the main callback of your middleware,
// it will be invoked after all 'before' middleware finish
// and before any 'after' middleware.
function createTask(done) {
    console.log('Invoked Second');
    done(null);
};

// Make the'create' Middleware Container using before/after hooks
midd.make(tasks, 'create', createTask, {beforeAfter: true});

/** ... */

// add a before hook
tasks.create.before(function(next) {
    console.log('Invoked First');
    next();
});

// add an after hook
tasks.create.after(function(next) {
    console.log('Invoked Third and last');
    next();
});

/** ... */

// invoke all middleware
tasks.create().done(function(err){
    // at this point all middleware have finished.
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

This example has created the Middleware Container `create` in the object `crud`. `create.crud` is a function that will invoke all the middleware.

You can add a third argument, the `optMainCallback`, this is the main payload of your middleware. `optOptions` is one more argument you can pass to Middlewarify to define behavior. Both `optOptions` and `optMainCallback` are optional and can be interswitched, i.e. you can pass options as a third argument, read on for examples and what are the available options.

#### make() Options

`make()` accepts the following options:

* `throwErrors` type: **Boolean**, default: `true` If set to false all thrown errors will be suppressed and available only through the `.done()` method.
* `beforeAfter` type: **Boolean**, default: `false` If set to true the Before/After hooks will be used instead of the single queue `use` hook, which is the default, view the [example displayed above](Using-the-Before-After-Middleware-type).

##### `throwErrors` Example

```js

// don't throw errors
var crud = {};
middlewarify.make(crud, 'create', {throwErrors: false});

crud.create.use(function(){
    throw new Error('an error');
});

// executing the middleware will not throw an error, the exception
// will be available only through the .done() callback
crud.create().done(function(err) {
    err.message === 'an error'; // true
});
```

#### The use(fn) Method

The Middleware Container by default exposes a `use` method so you can add any number of middleware. `use()` accepts any number of parameters as long they are of type Function or Arrays of Functions. When the Before/After flag is enabled `use` is no longer there and instead you get `before` and `after` methods to hook your middleware. All three hook types accept the same argument types and patterns as described bellow.

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

All middleware gets invoked with a callback so it can pass control to the next middleware.

following up on the previous examples:

```js
crud.create.use(function(next) {
    // do stuff
    next();
});
```

The first argument of the `next()` callback is the **error indicator**, any truthy value passed will be considered an error and stop executing the middleware chain right there and then.

```js
crud.create.use(function(next) {
    // something went wrong, bail out
    next('an error occured');
});
```

> If the Middleware Container is invoked with arguments, these arguments will be passed to all middleware and the callback function `next` **will always be the last argument**. Read the next section "Invoking the Middleware" for more.

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

Because any argument passed to the Middleware Container (`crud.create(arg1, arg2, fn1);`) will get piped to the middleware, we cannot add a callback within these arguments. Thus the function `.done()` is provided, so you can check for errors or results.

```js
crud.create(arg1, arg2, fn1).done(function(err) {
    if (err) {
        return console.error(err);
    }
    // all cool...
});
```

The only way to pass arguments back to the callback of the `.done()` method is through the *Final Callback* that is defined in the `make()` method.

```js
var crud = {};
var lastMiddlware = function(done) {
    // since this is the final middleware, we name the
    // callback "done" instead of "next"
    // and we invoke it with a null value as the first
    // argument to indicate there were no errors.
    done(null, 'one', 'two');
});

// now create the Middleware Container
middlewarify.make(crud, 'create', lastMiddlware);

// Invoke the Middleware Container
crud.create().done(function(err, arg1, arg2) {
  if (err) { /* tough love */ }

  arg1 === 'one'; // true
  arg2 === 'two'; // true
});
```

> **Beware of Error Handling** Middlewarify will catch all thrown errors from your middleware. They will be piped to the `.done()` method. So if any of your middleware functions throws an error, it will not be visible unless you setup the `.done()` callback.

#### Why a .done() function

The trailling `.done()` function will notify you of the ultimate outcome of the middleware execution. The problem for having the callback as an argument when invoking the middleware with `tasks.create()` is that there is no way to determine if that is the callback to call when all middleware are done, or an argument that should be passed to all middleware.

This becomes more aparent when using the Before/After feature of Middlewarify which binds a `before` and `after` functions instead of `use`.

```js

var midd = require('middlewarify');

var tasks = module.exports = {};

// this is the main callback of your middleware.
function createTask(cb, done) {
  anAsyncOp(function(err, result) {
    if (err) {
        cb(err);
        done(err);
        return;
    }

    // cb is the anon function passed as argument when the middleware will be
    // invoked, done will signal to Middlewarify that execution has completed.
    cb(null, result);
    done(null, result);
  });
}

// Make the'create' Middleware Container using before/after hooks
midd.make(tasks, 'create', createTask, {beforeAfter: true});

/** ... */

// add a before hook
tasks.create.before(function(cb, next) {
    // ...
    next();
});

// add an after hook
tasks.create.after(function(cb, result, next) {
    // do something with "result"
    next();
});

/** ... */

// invoke all middleware
tasks.create(function(err, result, done){
    // this is invoked by the "createTask" function and BEFORE any of the
    // "after" middleware are executed.

    done();
}).done(function(err, fn, result){
    // the "fn" is the anon function defined as an argument to tasks.create()!

    // at this point all middleware have finished.
});

```


## Release History
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
