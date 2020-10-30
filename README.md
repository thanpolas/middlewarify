# Middlewarify

Middleware pattern implementation, robust, easy, fast. You can add two types
of middleware, a single queue type using the keyword `use()` or a Before/After
type using `before()` and `after()` hooks.

[![Build Status](https://travis-ci.org/thanpolas/middlewarify.png)](https://travis-ci.org/thanpolas/middlewarify)

[![NPM](https://nodei.co/npm/middlewarify.png?downloads=true&stars=true)](https://nodei.co/npm/middlewarify/)

# Install

```shell
npm install middlewarify --save
```

# Documentation

## Quick Start Example

Creating a middleware:

```js
const middlewarify = require('middlewarify');

// this is the main callback of your middleware,
// it will be the last callback to be invoked.
function createTask(data) {
    console.log('createTask Final Fn to be invoked');
    return true;
}

const tasks = {};

// Make the'create' Middleware Container.
middlewarify.make(tasks, 'create', createTask);

module.exports = tasks;
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

// Add a second middleware to the 'create' operation
tasks.create.use(function(data) {
    console.log('middleware 2. Title:', data.title);
    data.secondAttr = 3;
});
```

... Invoke all the middleware

```js
// ... Invoking them all together
const result = tasks.create(data);

// The middleware are invoked in sequence and output:
// "middleware 1"
// "middleware 2"
// "createTask Final Fn to be invoked"

console.log(result);
// prints: true
```

## Middlewarify Methods

### make(object, property, optMainCallback, optOptions)

The `middlewarify.make()` method will apply the middleware pattern to an
Object's property, this property is the _Middleware Container_.

```js
// create a Middleware Container
const crud = {};
middlewarify.make(crud, 'create');
```

This example has created the Middleware Container `create` in the object
`crud`. `crud.create()` is a function that will invoke all the middleware.

You can pass a third argument, the `optMainCallback`, a Function. This will
be the _Main_ callback of your middleware, the result returned from that
function will be the returning value of the Middleware Container:

```js
const val = crud.create();
// val is passed from the Main callback.
```

`optOptions` defines behavior. Both `optOptions` and `optMainCallback` are
optional. You can pass options as a third argument, read on for
examples and what are the available options.

#### make() Options

`make()` accepts the following options:

-   `async` type: **Boolean**, default: `false` Enables asynchronous invocation
    of all middleware. Every middleware will be invoked asynchronously and the
    final returning value will be a promise.
-   `beforeAfter` type: **Boolean**, default: `false` If set to true the
    Before/After hooks will be used instead of the single queue `use` hook,
    which is the default.
    View the [Before After example](#using-the-before--after-middleware-type).
-   `catchAll` type **Function**, default: `null` If defined all errors will
    be piped to this callback, useful when Middleware is used as an
    Express middleware.

## The use(fn) Hook.

The Middleware Container by default exposes a `use` hook so you can add any
number of middleware. `use()` accepts any number of parameters as long they
are of type Function or Array of Functions. When the Before/After flag is
enabled `use` is no longer available and instead you get `before`, `after` and
`last` hooks. All hook types accept the same argument types and patterns as
described bellow:

```js
// create the Middleware Container
const crud = {};
middlewarify.make(crud, 'create', fnFinal);

// add 3 middleware functions
crud.create.use([fn1, fn2], fn3);

// then add another one
crud.create.use(fn4);
```

In the above example we added 4 middleware before the final method `fnFinal`
will be invoked. A FIFO queue is implemented so the order of execution will be:

1. `fn1()`
2. `fn2()`
3. `fn3()`
4. `fn4()`
5. `fnFinal()`

### Middleware Arguments

All middleware get invoked with the arguments that the _Middleware Container_
was invoked with. The same number or arguments, the exact same references:

```js
app.connect.use(function(req) {
    req.a === 1; // true
    req.a++;
});
app.connect.use(function(req) {
    req.a === 2; // true
});

const req = { a: 1 };
app.connect(req);
```

### Asynchronous Middleware Using Promises

When the option `async: true` is defined, all middleware get invoked
asynchronously. You can return a Promise from your middleware and
Middlewarify will wait for its resolution before passing control to the
next one.

```js
// create an async Middleware Container
const crud = {};
middlewarify.make(crud, 'create', fnFinal, { async: true });
crud.create.before(async () {
    await fs.read();
});
```

### Invoking the Middleware

The Middleware Container is a function that accepts any number of arguments.

Any argument passed to the Middleware Container will also be passed to
all middleware.

```js
const crud = {};
middlewarify.make(crud, 'create');

// run all middleware
crud.create({ a: 1, b: 2 }, 'bar');
```

Arguments of all middleware will get:

```js
crud.create.use(function(arg1, arg2) {
    arg1 === { a: 1, b: 2 }; // true

    arg2 === 'bar'; // true
});
```

### Middleware Results and Error Handling

When invoked, the _Middleware Container_ will return the execution outcome.
To handle any errors thrown, you simply have to wrap it in a try catch
block unless you have defined a `catchAll` error handler. In that case
the catchAll error handler will intercept any and all errors.

```js
try {
    const retVal = crud.create(arg1, arg2, fn1);
} catch (ex) {
    // handle the error...
    console.log('Error:', ex);
}
```

## Using the Before / After / Last Middleware types

To use the Before/After/Last hook types all you need to do is pass the
`{beforeAfter: true}` option to Middlewarify's `make()` method.

When using the `beforeAfter` option instead of the typical `use()` method
three new hooks are created on the resulting Middleware Container:

-   `midd.before()` Hook functions to be invoked **before** the main
    middleware function.
-   `midd.after()` Hook functions to be invoked **after** the main middleware
    function.
-   `midd.last()` Hook functions to be invoked **last**, after the main
    middleware and all middleware functions have been executed.

> All added hooks are invoked in the order they were added.

### Before / After / Last Middleware Example

```js
const middlewarify = require('middlewarify');

const tasks = (module.exports = {});

// This is the main callback of your middleware,
// it will be invoked after all 'before' middleware finish
// and before any 'after' middleware.
function createTask() {
    console.log('Invoked Second');
    return 999;
}

// Make the'create' Middleware Container using before/after hooks
middlewarify.make(tasks, 'create', createTask, { beforeAfter: true });

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
tasks.create().then(
    function(val) {
        // at this point all middleware have finished.
        console.log(val); // 999
    },
    function(err) {
        // handle error
    },
);
```

### After & Last Hooks get the Result as Argument

If your middleware if a Before / After type, then all `.after()` and `.last()`
hooks will receive an extra argument representing the returned value of
the main callback:

```js
middlewarify.make(crud, 'create', function(arg1, arg2) {
    return 'abc';
});

crud.create.after(function(arg1, arg2, val) {
    console.log(val); // prints 'abc'
});

crud.create(1, 2);
```

#### After & Last Hooks can Alter the Middleware Container's Return Result

All After & Last hooks may alter the return result as long as they return any
type of value except `undefined`:

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

-   **v2.1.0**, _30 Oct 2020_
    -   Updated all dependencies to latest (minor bump was a mistake, should 
            be patch ¯\_(ツ)_/¯).
-   **v2.0.0**, _09 Mar 2020_ **Breaking Changes**
    -   Middlewarify will now execute all middleware synchronously by default.
    -   Introduced new option `async` to enable the asynchronous invocation.
    -   Removed bluebird dependency, we are 100% native Promises.
-   **v1.0.1**, _30 Jan 2020_
    -   Updated all dependencies to latest.
-   **v1.0.0**, _23 Jul 2015_
    -   Honorary release.
    -   Updated all dependencies to latest.
-   **v0.4.0**, _25 Jul 2014_
    -   Now After & Last middlewares may alter the result value by returning a
        non undefined value.
-   **v0.3.8**, _24 Jul 2014_
    -   Implemented `.last()` middleware type in beforeAfter family.
-   **v0.3.7**, _03 Mar 2014_
    -   Added `catchAll` option for cases where invocations have no error handlers.
-   **v0.3.6**, _02 Mar 2014_
    -   Optimizations and better handling of errors.
    -   Updated to latest Bluebird, now suppresses unhandled errors.
-   **v0.3.4**, _19 Feb 2014_
    -   Update dependencies to latest.
-   **v0.3.3**, _15 Feb 2014_
    -   Resolving value now gets propagated to all `.after()` hooks.
-   **v0.3.2**, _09 Feb 2014_
    -   Optimize middleware invocation using `Promise.try()`
-   **v0.3.1**, _09 Feb 2014_
    -   Main Callback now passes value to final promise.
-   **v0.3.0**, _09 Feb 2014_
    -   Removed callback API, 100% Promise based API now.
-   **v0.2.0**, _08 Feb 2014_
    -   Major API change, introduced Promises to API.
-   **v0.1.0**, _28 Jan 2014_
    -   Added Before/After feature
    -   Reorganized tests
-   **v0.0.4**, _10 Oct 2013_
    -   Added option to not throw errors
-   **v0.0.3**, _02 Aug 2013_
    -   Added a more explicit way to declare callbacks when invoking the middleware.
-   **v0.0.2**, _15 JuL 2013_
    -   Big Bang

## License

Copyright Thanasis Polychronakis, licensed under the [MIT License](LICENSE-MIT).

[grunt]: http://gruntjs.com/
[getting started]: https://github.com/gruntjs/grunt/wiki/Getting-started
[gruntfile]: https://github.com/gruntjs/grunt/wiki/Sample-Gruntfile "Grunt's Gruntfile.js"
[grunt-replace]: https://github.com/erickrdch/grunt-string-replace 'Grunt string replace'
[grunt-s3]: https://github.com/pifantastic/grunt-s3 'grunt-s3 task'
[thanpolas]: https://github.com/thanpolas 'Thanasis Polychronakis'
