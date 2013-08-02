# Middlewarify

Apply the middleware pattern to any function.

[![Build Status](https://travis-ci.org/thanpolas/middlewarify.png)](https://travis-ci.org/thanpolas/middlewarify)

## Install

```shell
npm install middlewarify --save
```

## Documentation

Apply the middleware pattern:

```js
var midd = require('middlewarify');

var tasks = module.exports = {};

// this will be the last callback to be invoked
tasks._create = function() {
  console.log('tasks._create');
};

// Make the 'create' prop a middleware function.
midd.make(tasks, 'create', tasks._create);
```

...Add middleware

```js
// ... somewhere far far away in another file

var tasks = require('./tasks');

// add a middleware to the 'create' operation
tasks.create.use(function(done){
  console.log('middleware 1');
  done();
});

// add another middleware to the 'create' operation
tasks.create.use(function(done){
  console.log('middleware 2');
  done();
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

The `middlewarify.make()` method will apply the middleware pattern to an Object's property.

```js
var crud = {};
middlewarify.make(crud, 'create');
middlewarify.make(crud, 'read');
middlewarify.make(crud, 'update');
middlewarify.make(crud, 'delete');
```

Each time `make()` is used two new functions are added to the `crud` Object:

* `crud.create([, ...], optCallback)` This method will invoke all added middleware in the sequence they were defined. If the final argument is a Function, it will be treated as a callback after all middleware have finished. `crud.create( function( err ){ /* check err */ } )`
* `crud.create.use(middleware [, ...])` This method will add middleware Functions to the `crud.create` container.

#### The use(fn) Method

The middleware container exposes a `use` method to add middleware. `use()` accepts any number of parameters as long they are type Function or Arrays of Functions.

```js
var crud = {};
middlewarify.make(crud, 'create');

// add middleware
crud.create.use([fn1, fn2], fn3);
```

#### Invoking the callbacks

The middleware container is a function that accepts any number of arguments and an optional callback.

Any argument passed to the middleware container will also be passed to all middleware.

```js
var crud = {};
middlewarify.make(crud, 'create');

// run all middleware
crud.create(userDataObject);
```

The optional callback should always be defined last, it gets invoked when all middleware have finished. It provides at least one argument, `err` which if has a truthy value (typically an instance of `Error`) meas that something did not go well.

**The last middleware** to be invoked can pass arguments to the *Create Callback* like so:

```js
var crud = {};
var lastMiddlware = function(next) {
    /* ... */
    next(null, 'one', 'two');
});
middlewarify.make(crud, 'create', lastMiddlware);

// run all middleware
crud.create(userDataObject).done(function(err, arg1, arg2) {
  if (err) { /* tough love */ }

  arg1 === 'one'; // true
  arg2 === 'two'; // true
});
```

#### The Middleware Callback

When adding a `middleware` Function (i.e. `crud.create.use(middleware)`) by default it will be invoked with only one argument, the `next` callback. If you add arguments when calling the middleware container `crud.create(arg1, arg2)`, all middleware callbacks will be invoked with these arguments first. The `next` callback will always be last.

> Invoking next() with a truthy argument (i.e. `next(err)`) will stop invoking more middleware. The flow is passed to the `optFinalCallback` if defined in the `make()` method or silently dismissed.

```js
crud.create.use(function(arg1, arg2, next) {
  if (arg1 !== arg2) { return next(new Error('not a match'))}
  next();
});

crud.create(foo, bar);
```

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
