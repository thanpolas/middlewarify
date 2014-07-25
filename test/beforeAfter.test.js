/**
 * @fileOverview middlewarify tests
 */
var sinon  = require('sinon');
var assert = require('chai').assert;
var Promise = require('bluebird');

var midd = require('../');

var noop = function(){};

suite('6. Before / After / Last middleware', function() {

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
    assert.isFunction(obj.create.last, 'obj.create.last should be a function');
    assert.notProperty(obj.create, 'use', 'obj.create should NOT have a use fn');
    assert.isFunction(obj.create().then, 'obj.create().then should be a Function');
    assert.ok(Promise.is(obj.create()), 'obj.create() is a Promise');
  });
});

suite('6.2. middleware before/after Sequence of invocation', function() {
  var obj, midd1, midd2, midd3, midd4, midd5, midd6, middFinal, fnPayload;

  setup(function() {
    obj = Object.create(null);
    midd1 = sinon.spy();
    midd2 = sinon.spy();
    midd3 = sinon.spy();
    midd4 = sinon.spy();
    midd5 = sinon.spy();
    midd6 = sinon.spy();
    middFinal = sinon.spy();
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
      assert.ok(middFinal.calledOnce, 'middFinal called only once, called: ' + middFinal.callCount);
      assert.ok(fnPayload.calledOnce, 'fnPayload called only once');

      assert.ok(midd1.calledBefore(midd2), '"midd1" called before "midd2"');
      assert.ok(midd2.calledBefore(midd3), '"midd2" called before "midd3"');
      assert.ok(midd3.calledBefore(fnPayload), '"midd3" called before "fnPayload"');
      assert.ok(fnPayload.calledBefore(midd4), '"fnPayload" called before "midd4"');
      assert.ok(midd4.calledBefore(midd5), '"midd4" called before "midd5"');
      assert.ok(midd5.calledBefore(midd6), '"midd5" called before "midd6"');
      assert.ok(midd6.calledBefore(middFinal), '"midd6" called before "middFinal"');
    }).then(done, done);
  });

  test('6.2.1 Multiple arguments', function() {
    obj.create.before(midd1, midd2, midd3);
    obj.create.last(middFinal);
    obj.create.after(midd4, midd5, midd6);
  });
  test('6.2.2 Multiple calls', function() {
    obj.create.last(middFinal);
    obj.create.before(midd1);
    obj.create.before(midd2);
    obj.create.before(midd3);
    obj.create.after(midd4);
    obj.create.after(midd5);
    obj.create.after(midd6);
  });
  test('6.2.3 An array', function() {
    obj.create.before([midd1, midd2, midd3]);
    obj.create.last([middFinal]);
    obj.create.after([midd4, midd5, midd6]);
  });
  test('6.2.4 Array mixed with arg', function() {
    obj.create.before([midd1, midd2], midd3);
    obj.create.last(middFinal);
    obj.create.after([midd4, midd5], midd6);
  });
});

suite('6.3. middleware() argument piping', function() {
  var obj, mainMidd, firstMidd, secondMidd, thirdMidd, lastMidd;
  setup(function() {
  });

  teardown(function(){
  });

  test('6.3.1 Three arguments', function(done) {
    obj = Object.create(null);
    mainMidd = sinon.spy();
    firstMidd = sinon.spy();
    secondMidd = sinon.spy();
    thirdMidd = sinon.spy();
    lastMidd = sinon.spy();
    midd.make(obj, 'create', mainMidd, {beforeAfter: true});
    obj.create.before(firstMidd, secondMidd);
    obj.create.after(thirdMidd);
    obj.create.last(lastMidd);

    var foo = {a: 1};
    var bar = {b: 2};
    obj.create(1, foo, bar).then(function() {
      assert.ok(firstMidd.alwaysCalledWith(1, foo, bar), 'firstMidd should be invoked with these arguments');
      assert.ok(secondMidd.alwaysCalledWith(1, foo, bar), 'secondMidd should be invoked with these arguments');
      assert.ok(thirdMidd.alwaysCalledWith(1, foo, bar), 'thirdMidd should be invoked with these arguments');
      assert.ok(mainMidd.alwaysCalledWith(1, foo, bar), 'mainMidd should be invoked with these arguments');
      assert.ok(lastMidd.alwaysCalledWith(1, foo, bar), 'lastMidd should be invoked with these arguments');
      done();
    }, done).then(null, done);
  });
  suite('6.3.2 Main Callback arguments pipes to final promise', function() {
    function invoke(returnValue) {
      obj = Object.create(null);
      mainMidd = function() {
        return returnValue;
      };
      firstMidd = sinon.spy();
      secondMidd = sinon.spy();
      thirdMidd = sinon.spy();
      midd.make(obj, 'create', mainMidd, {beforeAfter: true});
      obj.create.before(firstMidd, secondMidd);
      obj.create.after(thirdMidd);
    }
    test('6.3.2.1 Using a promise', function(done) {
      var prom = new Promise(function(resolve){
        resolve('value');
      });
      invoke(prom);

      obj.create().then(function(val) {
        assert.equal(val, 'value');
      }).then(done, done);
    });
    test('6.3.2.2 Using a string', function(done) {
      invoke('value');
      obj.create().then(function(val) {
        assert.equal(val, 'value');
      }).then(done, done);
    });
    test('6.3.2.3 Using a number', function(done) {
      invoke(9);
      obj.create().then(function(val) {
        assert.equal(val, 9);
      }).then(done, done);
    });
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


  test('6.5.1.2 Main callback throws an error', function(done){
    var custObj = Object.create(null);
    midd.make(custObj, 'create', function() {
      throw new Error('an error');
    }, {beforeAfter: true});

    custObj.create().then(noop, function(err){
      assert.instanceOf(err, Error, '"err" should be instanceOf Error');
      assert.equal(err.message, 'an error', 'Error message should match');
      done();
    }, done).then(null, done);
  });
  test('6.5.1.3 Main callback throws an error async', function(done){
    function promiseAsyncReject() {
      return new Promise(function(resolve, reject) {
        setTimeout(function(){
          reject(new Error('an error'));
        });
      });
    }

    var custObj = Object.create(null);
    midd.make(custObj, 'create', function() {
      return promiseAsyncReject()
        .catch(function(err) {
          console.log('err:', err);
          throw err;
        });
    }, {beforeAfter: true});

    custObj.create().then(noop, function(err){
      assert.instanceOf(err, Error, '"err" should be instanceOf Error');
      assert.equal(err.message, 'an error', 'Error message should match');
      done();
    }, done).then(null, done);
  });
});
suite('6.6. Resolving Value propagation to After middl', function(){
  var obj;
  setup(function(){
    obj = Object.create(null);
  });
  test('6.6.1 resolving value gets passed as an extra argument by promise', function(done) {
    midd.make(obj, 'create', function() {
      return new Promise(function(resolve) {
        setTimeout(function(){
          resolve('abc');
        });
      });
    },{beforeAfter: true});

    obj.create.after(function(arg1, arg2, resolveValue) {
      assert.equal(resolveValue, 'abc');
    });
    obj.create(1, 2).then(done.bind(null, null), done);
  });
  test('6.6.2 resolving value gets passed as an extra argument by returning', function(done) {
    midd.make(obj, 'create', function() {
      return 'abc';
    }, {beforeAfter: true});

    obj.create.after(function(arg1, arg2, resolveValue) {
      assert.equal(resolveValue, 'abc');
    });
    obj.create(1, 2).then(done.bind(null, null), done);
  });
});

suite('6.7 Unhandled errors', function() {
  var obj;
  setup(function(){
    obj = Object.create(null);
  });
  test('6.7.1 Throwing errors does not cause Unhandled exceptions', function(done) {
    Promise.onPossiblyUnhandledRejection(done);
    midd.make(obj, 'create', Promise.method(function() {
      throw new Error('Boo');
    }), {beforeAfter: true});

    obj.create().catch(function(err) {
      assert.equal(err.message, 'Boo');
      assert.instanceOf(err, Error);
    }).then(done, done);
  });
  test('6.7.2 Throwing errors does not cause Unhandled exceptions', function(done) {
    Promise.onPossiblyUnhandledRejection(done);

    function prom() {
      return new Promise(function(resolve) {
        setTimeout(resolve, 1000);
      });
    }

    midd.make(obj, 'create', Promise.method(function() {
      return prom().then(function() {
        throw new Error('Boo');
      });
    }), {beforeAfter: true});

    obj.create().catch(function(err) {
      assert.equal(err.message, 'Boo');
      assert.instanceOf(err, Error);
    }).then(done, done);
  });
  test('6.7.3 Rejecting promise does not cause Unhandled exceptions', function(done) {
    Promise.onPossiblyUnhandledRejection(done);
    midd.make(obj, 'create', function() {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          reject('lol');
        });
      });
    }, {beforeAfter: true});

    obj.create().catch(function(err) {
      assert.equal(err, 'lol');
    }).then(done, done);
  });
});

suite('6.8 Resolving Value can be altered by After & Last middleware', function() {
  var obj;
  setup(function(){
    obj = Object.create(null);
  });
  test('6.8.1 After middleware can alter outcome ASYNC', function(done) {
    midd.make(obj, 'create', function() {
      return 'abc';
    },{beforeAfter: true});

    obj.create.after(function() {
      return Promise.resolve('def');
    });
    obj.create.after(function(resolveValue) {
      assert.equal(resolveValue, 'def');
    });

    obj.create().then(done.bind(null, null), done);
  });
  test('6.8.2 After middleware can alter outcome SYNC', function(done) {
    midd.make(obj, 'create', function() {
      return 'abc';
    },{beforeAfter: true});

    obj.create.after(function() {
      return 'def';
    });
    obj.create.after(function(resolveValue) {
      assert.equal(resolveValue, 'def');
    });

    obj.create().then(done.bind(null, null), done);
  });
  test('6.8.3 Last middleware can alter outcome ASYNC', function(done) {
    midd.make(obj, 'create', function() {
      return 'abc';
    },{beforeAfter: true});

    obj.create.last(function() {
      return Promise.resolve('def');
    });
    obj.create.last(function(resolveValue) {
      assert.equal(resolveValue, 'def');
    });

    obj.create().then(done.bind(null, null), done);
  });
  test('6.8.4 Last middleware can alter outcome SYNC', function(done) {
    midd.make(obj, 'create', function() {
      return 'abc';
    },{beforeAfter: true});

    obj.create.last(function() {
      return 'def';
    });
    obj.create.last(function(resolveValue) {
      assert.equal(resolveValue, 'def');
    });

    obj.create().then(done.bind(null, null), done);
  });
});
