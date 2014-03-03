/**
 * @fileOverview middlewarify tests
 */

var sinon  = require('sinon');
var assert = require('chai').assert;
var Promise = require('bluebird');
var midd = require('../');

var noop = function(){};

suite('1. Basic Tests', function() {

  setup(function() {});

  teardown(function() {});

  // The numbering (e.g. 1.1.1) has nothing to do with order
  // The purpose is to provide a unique string so specific tests are
  // run by using the mocha --grep "1.1.1" option.

  test('1.1 Types Test', function() {
    var obj = Object.create(null);
    midd.make(obj, 'create');
    assert.isFunction(obj.create, 'obj.create should be a function');
    assert.isFunction(obj.create.use, 'obj.create.use should be a function');
    assert.isFunction(obj.create().then, 'obj.create().then should be a Function');
    assert.ok(Promise.is(obj.create()), 'obj.create().then is a Promise');
  });
});

suite('2. middleware.use() Sequence of invocation Synchronous', function() {
  var obj, lastMidd, firstMidd, secondMidd, thirdMidd;
  setup(function() {
    obj = Object.create(null);
    lastMidd = sinon.spy();
    firstMidd = sinon.spy();
    secondMidd = sinon.spy();
    thirdMidd = sinon.spy();
    midd.make(obj, 'create', lastMidd);
  });

  teardown(function(done){
    obj.create().then(function() {
      assert.ok(firstMidd.calledOnce, 'firstMidd should be called only once. Called: ' + firstMidd.callCount);
      assert.ok(secondMidd.calledOnce, 'secondMidd should be called only once. Called: ' + secondMidd.callCount);
      assert.ok(thirdMidd.calledOnce, 'thirdMidd should be called only once. Called: ' + thirdMidd.callCount);
      assert.ok(lastMidd.calledOnce, 'lastMidd should be called only once. Called: ' + lastMidd.callCount);

      assert.ok(firstMidd.calledBefore(secondMidd), 'firstMidd should be called before secondMidd');
      assert.ok(secondMidd.calledAfter(firstMidd), 'secondMidd should be called after firstMidd');
      assert.ok(thirdMidd.calledAfter(secondMidd), 'thirdMidd should be called after secondMidd');
      assert.ok(lastMidd.calledAfter(thirdMidd), 'lastMidd should be called after thirdMidd');
    }).then(done, done);
  });

  test('2.1 Multiple arguments', function() {
    obj.create.use(firstMidd, secondMidd, thirdMidd);
  });
  test('2.2 Multiple calls', function() {
    obj.create.use(firstMidd);
    obj.create.use(secondMidd);
    obj.create.use(thirdMidd);
  });
  test('2.3 An array', function() {
    obj.create.use([firstMidd, secondMidd, thirdMidd]);
  });
  test('2.4 Array mixed with arg', function() {
    obj.create.use([firstMidd, secondMidd], thirdMidd);
  });
});

suite('2.10 middleware.use() Sequence of invocation Asynchronous', function() {
  var obj, lastMidd, firstMidd, secondMidd, thirdMidd;
  var spyLastMidd, spyFirstMidd, spySecondMidd, spyThirdMidd;

  setup(function() {
    spyLastMidd = sinon.spy();
    spyFirstMidd = sinon.spy();
    spySecondMidd = sinon.spy();
    spyThirdMidd = sinon.spy();

    obj = Object.create(null);
    lastMidd = function() {spyLastMidd();};
    firstMidd = function() {spyFirstMidd();};
    secondMidd = function() {spySecondMidd();};
    thirdMidd = function() {spyThirdMidd();};
    midd.make(obj, 'create', lastMidd);
  });

  teardown(function(done) {
    obj.create().then(function(){
      assert.ok(spyFirstMidd.calledOnce, 'firstMidd should be called only once');
      assert.ok(spySecondMidd.calledOnce, 'secondMidd should be called only once');
      assert.ok(spyThirdMidd.calledOnce, 'thirdMidd should be called only once');
      assert.ok(spyLastMidd.calledOnce, 'lastMidd should be called only once');

      assert.ok(spyFirstMidd.calledBefore(spySecondMidd), 'firstMidd should be called before secondMidd');
      assert.ok(spySecondMidd.calledAfter(spyFirstMidd), 'secondMidd should be called after firstMidd');
      assert.ok(spyThirdMidd.calledAfter(spySecondMidd), 'thirdMidd should be called after secondMidd');
      assert.ok(spyLastMidd.calledAfter(spyThirdMidd), 'lastMidd should be called after thirdMidd');
    }).then(done, done);
  });

  test('2.10.1 Multiple arguments', function() {
    obj.create.use(firstMidd, secondMidd, thirdMidd);
  });
  test('2.10.2 Multiple calls', function() {
    obj.create.use(firstMidd);
    obj.create.use(secondMidd);
    obj.create.use(thirdMidd);
  });
  test('2.10.3 An array', function() {
    obj.create.use([firstMidd, secondMidd, thirdMidd]);
  });
  test('2.10.4 Array mixed with arg', function() {
    obj.create.use([firstMidd, secondMidd], thirdMidd);
  });
});

suite('3. middleware() argument piping', function() {
  var obj, lastMidd, firstMidd, secondMidd, thirdMidd;

  teardown(function(){
  });

  test('3.1 Three arguments', function(done) {
    function checkMiddlewareArgs(arg1, arg2, arg3) {
      assert.equal(arg1, 1);
      assert.deepEqual(arg2, {a: 1});
      assert.deepEqual(arg3, {b: 2});
    }

    obj = Object.create(null);
    lastMidd = checkMiddlewareArgs;
    firstMidd = checkMiddlewareArgs;
    secondMidd = checkMiddlewareArgs;
    thirdMidd = checkMiddlewareArgs;
    midd.make(obj, 'create', lastMidd);
    obj.create.use(firstMidd, secondMidd, thirdMidd);

    var foo = {a: 1};
    var bar = {b: 2};
    obj.create(1, foo, bar).then(function() {
      done();
    }, done).then(null, done);
  });
  test('3.2 Mutating arguments', function(done) {
    var count = 1;
    function checkMiddlewareArgs(foo, bar) {
      foo.a++;
      bar.b++;
      count++;
      assert.equal(foo.a, count);
      assert.deepEqual(bar.b, count + 1);
    }

    obj = Object.create(null);
    lastMidd = checkMiddlewareArgs;
    firstMidd = checkMiddlewareArgs;
    secondMidd = checkMiddlewareArgs;
    thirdMidd = checkMiddlewareArgs;
    midd.make(obj, 'create', lastMidd);
    obj.create.use(firstMidd, secondMidd, thirdMidd);

    var foo = {a: 1};
    var bar = {b: 2};
    obj.create(foo, bar).then(function() {
      done();
    }, done).then(null, done);
  });
});

suite('4 middleware returning values', function() {
  function invoke(returnValue, done) {
    var lastMidd = function() {};
    var firstMidd = function() {return returnValue;};
    var obj = Object.create(null);
    midd.make(obj, 'create', lastMidd);
    obj.create.use(firstMidd);
    obj.create().then(done, done);
  }
  test('4.1 return undefined', function(done) {
    invoke(undefined, done);
  });
  test('4.2 return null', function(done) {
    invoke(null, done);
  });
  test('4.3 return void', function(done) {
    invoke(void 0, done);
  });
  test('4.4 return boolean false', function(done) {
    invoke(false, done);
  });
  test('4.5 return boolean true', function(done) {
    invoke(true, done);
  });
  test('4.6 return empty object', function(done) {
    invoke({}, done);
  });
  test('4.7 return string', function(done) {
    invoke('one', done);
  });
  test('4.8 return number', function(done) {
    invoke(7, done);
  });
  test('4.9 return number 0', function(done) {
    invoke(0, done);
  });
  test('4.10 return NaN', function(done) {
    invoke(NaN, done);
  });
  test('4.11 return empty Array', function(done) {
    invoke([], done);
  });
  test('4.12 return function', function(done) {
    invoke(function(){}, done);
  });
  test('4.13 return regex', function(done) {
    invoke(/a/, done);
  });
  test('4.13 return Error instance', function(done) {
    invoke(new Error('inst'), done);
  });

});

suite('5. Failing middleware cases', function(){
  var obj;
  setup(function(){
    obj = Object.create(null);
    midd.make(obj, 'create');
  });

  test('5.1.2 middleware accepts throw error', function(done){
    var custObj = Object.create(null);
    midd.make(custObj, 'create');
    custObj.create.use(function(){
      throw new Error('an error');
    });
    custObj.create().then(noop, function(err){
      assert.instanceOf(err, Error, '"err" should be instanceOf Error');
      assert.equal(err.message, 'an error', 'Error message should match');
      done();
    }).then(null, done);
  });
  test('5.1.3 main callback accepts throw error', function(done){
    var custObj = Object.create(null);
    midd.make(custObj, 'create', function() {
      throw new Error('an error');
    });
    custObj.create().then(noop, function(err){
      assert.instanceOf(err, Error, '"err" should be instanceOf Error');
      assert.equal(err.message, 'an error', 'Error message should match');
      done();
    }).then(null, done);
  });

  test('5.1.4 Catch All option', function(done) {
    var custObj = Object.create(null);
    midd.make(custObj, 'create', function() {
      throw new Error('an error');
    }, {
      catchAll: function(err) {
        assert.instanceOf(err, Error, '"err" should be instanceOf Error');
        assert.equal(err.message, 'an error', 'Error message should match');
        done();
      },
    });
    custObj.create();
  });

});

suite('3.5.2 Main Callback arguments pipes to final promise', function() {
  var obj;
  function invoke(returnValue) {
    obj = Object.create(null);
    var mainMidd = function() {
      return returnValue;
    };
    var firstMidd = sinon.spy();
    var secondMidd = sinon.spy();
    var thirdMidd = sinon.spy();
    midd.make(obj, 'create', mainMidd);
    obj.create.use(firstMidd, secondMidd, thirdMidd);
  }
  test('3.5.2.1 Using a promise', function(done) {
    var prom = new Promise(function(resolve){
      resolve('value');
    });
    invoke(prom);

    obj.create().then(function(val) {
      assert.equal(val, 'value');
    }).then(done, done);
  });
  test('3.5.2.2 Using a string', function(done) {
    invoke('value');
    obj.create().then(function(val) {
      assert.equal(val, 'value');
    }).then(done, done);
  });
  test('3.5.2.3 Using a number', function(done) {
    invoke(9);
    obj.create().then(function(val) {
      assert.equal(val, 9);
    }).then(done, done);
  });
});
