/**
 * @fileOverview middlewarify tests
 */
var sinon  = require('sinon');
var assert = require('chai').assert;
var Promise = require('bluebird');

var midd = require('../');

var noop = function(){};

suite('6. Before / After middleware', function() {

  setup(function() {});

  teardown(function() {});

  // The numbering (e.g. 1.1.1) has nothing to do with order
  // The purpose is to provide a unique string so specific tests are
  // run by using the mocha --grep "1.1.1" option.

  test('6.1 Types Test', function() {
    var obj = Object.create(null);
    midd.make(obj, 'create', {
      beforeAfter: true,
    });
    assert.isFunction(obj.create, 'obj.create should be a function');
    assert.isFunction(obj.create.before, 'obj.create.before should be a function');
    assert.isFunction(obj.create.after, 'obj.create.after should be a function');
    assert.notProperty(obj.create, 'use', 'obj.create should NOT have a use fn');
    assert.isFunction(obj.create().then, 'obj.create().then should be a Function');
    assert.ok(Promise.is(obj.create()), 'obj.create() is a Promise');
  });
});

suite('6.2. middleware before/after Sequence of invocation', function() {
  var obj, midd1, midd2, midd3, midd4, midd5, midd6, fnPayload;

  setup(function() {
    obj = Object.create(null);
    midd1 = sinon.spy();
    midd2 = sinon.spy();
    midd3 = sinon.spy();
    midd4 = sinon.spy();
    midd5 = sinon.spy();
    midd6 = sinon.spy();
    fnPayload = sinon.spy();
    midd.make(obj, 'create', fnPayload, {beforeAfter: true});
  });

  teardown(function(done) {
    obj.create().then(function() {
      assert.ok(midd1.calledOnce, 'midd1 called only once, called: ' + midd1.callCount);
      assert.ok(midd2.calledOnce, 'midd2 called only once, called: ' + midd2.callCount);
      assert.ok(midd3.calledOnce, 'midd3 called only once, called: ' + midd3.callCount);
      assert.ok(midd4.calledOnce, 'midd4 called only once, called: ' + midd4.callCount);
      assert.ok(midd5.calledOnce, 'midd5 called only once, called: ' + midd5.callCount);
      assert.ok(midd6.calledOnce, 'midd6 called only once, called: ' + midd6.callCount);
      assert.ok(fnPayload.calledOnce, 'fnPayload called only once');

      assert.ok(midd1.calledBefore(midd2), '"midd1" called before "midd2"');
      assert.ok(midd2.calledBefore(midd3), '"midd2" called before "midd3"');
      assert.ok(midd3.calledBefore(fnPayload), '"midd3" called before "fnPayload"');
      assert.ok(fnPayload.calledBefore(midd4), '"fnPayload" called before "midd4"');
      assert.ok(midd4.calledBefore(midd5), '"midd4" called before "midd5"');
      assert.ok(midd5.calledBefore(midd6), '"midd5" called before "midd6"');
    }).then(done, done);
  });

  test('6.2.1 Multiple arguments', function() {
    obj.create.before(midd1, midd2, midd3);
    obj.create.after(midd4, midd5, midd6);
  });
  test('6.2.2 Multiple calls', function() {
    obj.create.before(midd1);
    obj.create.before(midd2);
    obj.create.before(midd3);
    obj.create.after(midd4);
    obj.create.after(midd5);
    obj.create.after(midd6);
  });
  test('6.2.3 An array', function() {
    obj.create.before([midd1, midd2, midd3]);
    obj.create.after([midd4, midd5, midd6]);
  });
  test('6.2.4 Array mixed with arg', function() {
    obj.create.before([midd1, midd2], midd3);
    obj.create.after([midd4, midd5], midd6);
  });
});

suite('6.3. middleware() argument piping', function() {
  var obj, mainMidd, firstMidd, secondMidd, thirdMidd;
  setup(function() {
    obj = Object.create(null);
    mainMidd = sinon.spy();
    firstMidd = sinon.spy();
    secondMidd = sinon.spy();
    thirdMidd = sinon.spy();
    midd.make(obj, 'create', mainMidd, {beforeAfter: true});
    obj.create.before(firstMidd, secondMidd);
    obj.create.after(thirdMidd);
  });

  teardown(function(){
  });

  test('6.3.1 Three arguments', function(done) {
    var foo = {a: 1};
    var bar = {b: 2};
    obj.create(1, foo, bar).then(function(err){
      assert.notOk(err, 'error should not be truthy');
      assert.ok(firstMidd.alwaysCalledWith(1, foo, bar), 'firstMidd should be invoked with these arguments');
      assert.ok(secondMidd.alwaysCalledWith(1, foo, bar), 'secondMidd should be invoked with these arguments');
      assert.ok(thirdMidd.alwaysCalledWith(1, foo, bar), 'thirdMidd should be invoked with these arguments');
      assert.ok(mainMidd.alwaysCalledWith(1, foo, bar), 'mainMidd should be invoked with these arguments');
      done();
    }, done).then(null, done);
  });
});

suite('6.5. Failing middleware cases', function(){
  var obj;
  setup(function(){
    obj = Object.create(null);
    midd.make(obj, 'create', {beforeAfter: true});
  });
  test('6.5.1.1 Before middleware throws an error', function(done){
    obj.create.before(function() {
      throw new Error('an error');
    });

    obj.create().then(null, function(err) {
      assert.instanceOf(err, Error);
      assert.equal(err.message, 'an error');
      done();
    }).then(null, done);
  });

  test('6.5.1.1.2 After middleware throws an error', function(done){
    obj.create.after(function() {
      throw new Error('an error');
    });

    obj.create().then(null, function(err) {
      assert.instanceOf(err, Error);
      assert.equal(err.message, 'an error');
      done();
    }).then(null, done);
  });


  test('6.5.1.2 Before middleware throws an error when param is not throw', function(done){
    var custObj = Object.create(null);
    midd.make(custObj, 'create', {beforeAfter: true});

    custObj.create.before(function() {
      throw new Error('an error');
    });

    custObj.create().then(noop, function(err){
      assert.instanceOf(err, Error, '"err" should be instanceOf Error');
      assert.equal(err.message, 'an error', 'Error message should match');
      done();
    }, done).then(null, done);
  });
  test('6.5.1.3 After middleware throws an error when param is not throw', function(done){
    var custObj = Object.create(null);
    midd.make(custObj, 'create', {beforeAfter: true});
    custObj.create.after(function(){
      throw new Error('an error');
    });
    custObj.create().then(noop, function(err){
      assert.instanceOf(err, Error, '"err" should be instanceOf Error');
      assert.equal(err.message, 'an error', 'Error message should match');
      done();
    }, done).then(null, done);
  });
});
