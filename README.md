# Middlewarify

Apply the middleware pattern to any function.

[![Build Status](https://travis-ci.org/thanpolas/middlewarify.png)](https://travis-ci.org/thanpolas/middlewarify)

## Install

```shell
npm install middlewarify --save
```

## Documentation


### Quick Start Examples

Creating a middleware:

```js
var midd = require('middlewarify');

var tasks = module.exports = {};

// this will be the last callback to be invoked
tasks._create = function(done) {
  console.log('tasks._create Final Fn to be invoked');
  done();
};

// Make the'create' Middleware Container.
midd.make(tasks, 'create', tasks._create);
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

### Methods

#### make(object, property, optFinalCallback)

The `middlewarify.make()` method will apply the middleware pattern to an Object's property, this property will be called the *Middleware Container*.

```js
// create a Middleware Container
var crud = {};
middlewarify.make(crud, 'create');
```

This example has created the Middleware Container `create` in the object `crud`. `create.crud` is a function that will invoke all the middleware.

You can add a third argument, the `optFinalCallback`. As the name suggests this will be the final callback to be invoked in the chain of middleware execution. This callback gets the same arguments as any other middleware.

#### The use(fn) Method

The Middleware Container exposes a `use` method so you can add any number of middleware. `use()` accepts any number of parameters as long they are of type Function or Arrays of Functions.

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

The first argument of the callback is the **error indicator**, any truthy value passed will be considered as an error and stop executing the middleware chain right there and then.

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

So if we had setup a middleware that's what arguments it would get:

```js
crud.create.use(function(arg1, arg2, next) {
    arg1 === {a:1, b:2}; // true

    arg2 === 'bar'; // true

    next();
});
```

#### Getting the Middleware Results and Error Handling

Because any argument passed to the Middleware Container (`crud.create(arg1, arg2, fn1);` will get piped to all the middleware, we cannot add a callback within these arguments. Thus the function `.done()` is provided, so you can check for errors or the final results.

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

> **Beware of Error Handling** Middlewarify will catch all thrown errors from your middleware. They will be piped to the `.done()` method. So if any of your middleware functions throws an error, it will not be visible unless you setup the `done()` callback.

## Release History
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
