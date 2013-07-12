/**
 * @fileOverview middlewarify tests
 */

var sinon  = require('sinon');
var assert = require('chai').assert;

var midd = require('./');

// var noop = function(){};

suite('1. Unit Tests', function() {

  setup(function() {});

  teardown(function() {});


  // The numbering (e.g. 1.1.1) has nothing to do with order
  // The purpose is to provide a unique string so specific tests are
  // run by using the mocha --grep "1.1.1" option.


  test('1.1.1 Types Test', function() {
    var obj = Object.create(null);
    midd.make(obj, 'create');
    assert.isFunction(obj.create, 'obj.create should be a function');
    assert.isFunction(obj.create.use, 'obj.create.use should be a function');
  });

  suite('1.10 middleware.use() Sequence of invocation', function() {
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
    });

    test('1.10.1 Multiple arguments', function() {
      obj.create.use(firstMidd, secondMidd, thirdMidd);
    });
    test('1.10.2 Multiple calls', function() {
      obj.create.use(firstMidd);
      obj.create.use(secondMidd);
      obj.create.use(thirdMidd);
    });
    test('1.10.3 An array', function() {
      obj.create.use([firstMidd, secondMidd, thirdMidd]);
    });
    test('1.10.4 Array mixed with arg', function() {
      obj.create.use([firstMidd, secondMidd], thirdMidd);
    });

  });

});