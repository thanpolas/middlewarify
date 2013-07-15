/**
 * @fileOverview middlewarify tests
 */

var sinon  = require('sinon');
var assert = require('chai').assert;

var midd = require('./');

// var noop = function(){};

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
  });
});

suite('2. middleware.use() Sequence of invocation', function() {
  var obj, lastMidd, firstMidd, secondMidd, thirdMidd;
  setup(function() {
    obj = Object.create(null);
    lastMidd = sinon.spy();
    firstMidd = sinon.spy();
    secondMidd = sinon.spy();
    thirdMidd = sinon.spy();
    midd.make(obj, 'create', lastMidd);
  });

  teardown(function(){
    obj.create();
    firstMidd.yield();
    secondMidd.yield();
    thirdMidd.yield();
    lastMidd.yield();
    assert.ok(firstMidd.calledOnce, 'firstMidd should be called only once');
    assert.ok(secondMidd.calledOnce, 'secondMidd should be called only once');
    assert.ok(thirdMidd.calledOnce, 'thirdMidd should be called only once');
    assert.ok(lastMidd.calledOnce, 'lastMidd should be called only once');

    assert.ok(firstMidd.calledBefore(secondMidd), 'firstMidd should be called before secondMidd');
    assert.ok(secondMidd.calledAfter(firstMidd), 'secondMidd should be called after firstMidd');
    assert.ok(thirdMidd.calledAfter(secondMidd), 'thirdMidd should be called after secondMidd');
    assert.ok(lastMidd.calledAfter(thirdMidd), 'lastMidd should be called after thirdMidd');

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

suite('3. middleware() argument piping', function() {
  var obj, lastMidd, firstMidd, secondMidd, thirdMidd;
  function callAll(index) {
    firstMidd.callArg(index);
    secondMidd.callArg(index);
    thirdMidd.callArg(index);
    lastMidd.callArg(index);
  }
  setup(function() {
    obj = Object.create(null);
    lastMidd = sinon.spy();
    firstMidd = sinon.spy();
    secondMidd = sinon.spy();
    thirdMidd = sinon.spy();
    midd.make(obj, 'create', lastMidd);
    obj.create.use(firstMidd, secondMidd, thirdMidd);
  });

  teardown(function(){
  });

  test('3.1 Three arguments', function(done) {
    var foo = {a: 1};
    var bar = {b: 2};
    obj.create(1, foo, bar, function(err){
      assert.notOk(err, 'error should not be truthy');
      assert.ok(firstMidd.alwaysCalledWith(1, foo, bar), 'firstMidd should be invoked with these arguments');
      assert.ok(secondMidd.alwaysCalledWith(1, foo, bar), 'secondMidd should be invoked with these arguments');
      assert.ok(thirdMidd.alwaysCalledWith(1, foo, bar), 'thirdMidd should be invoked with these arguments');
      assert.ok(lastMidd.alwaysCalledWith(1, foo, bar), 'lastMidd should be invoked with these arguments');
      done();
    });
    callAll(3);
  });
});

suite('4. Final middleware arguments', function(){
  test('4.1 Last middleware passes arguments to create callback', function(done) {
    var obj = Object.create(null);
    midd.make(obj, 'create', function(cb){
      cb(null, 1, 2);
    });

    obj.create(function(err, arg1, arg2){
      assert.equal(1, arg1, 'Arg1 should be 1');
      assert.equal(2, arg2, 'Arg2 should be 2');
      done();
    });
  });
});
