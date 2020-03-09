/**
 * @fileoverview Test Before / After / Last middleware with Synchronous API.
 */
const sinon = require('sinon');
const { assert } = require('chai');
const Promise = require('bluebird');

const midd = require('../');

const noop = function() {};

suite('6. Before / After / Last Synchronous middleware', function() {
  setup(function() {});

  teardown(function() {});

  // The numbering (e.g. 1.1.1) has nothing to do with order
  // The purpose is to provide a unique string so specific tests are
  // run by using the mocha --grep "1.1.1" option.

  test('6.1 Types Test', function() {
    const obj = Object.create(null);
    midd.make(obj, 'create', {
      beforeAfter: true,
    });
    assert.isFunction(obj.create, 'obj.create should be a function');
    assert.isFunction(
      obj.create.before,
      'obj.create.before should be a function',
    );
    assert.isFunction(
      obj.create.after,
      'obj.create.after should be a function',
    );
    assert.isFunction(obj.create.last, 'obj.create.last should be a function');
    assert.notProperty(
      obj.create,
      'use',
      'obj.create should NOT have a use fn',
    );
  });
});

suite('6.2. middleware before/after Sequence of invocation', function() {
  let obj;
  let midd1;
  let midd2;
  let midd3;
  let midd4;
  let midd5;
  let midd6;
  let middFinal;
  let fnPayload;

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
    midd.make(obj, 'create', fnPayload, { beforeAfter: true });
  });

  teardown(function() {
    obj.create();
    assert.ok(
      midd1.calledOnce,
      `midd1 called only once, called: ${midd1.callCount}`,
    );
    assert.ok(
      midd2.calledOnce,
      `midd2 called only once, called: ${midd2.callCount}`,
    );
    assert.ok(
      midd3.calledOnce,
      `midd3 called only once, called: ${midd3.callCount}`,
    );
    assert.ok(
      midd4.calledOnce,
      `midd4 called only once, called: ${midd4.callCount}`,
    );
    assert.ok(
      midd5.calledOnce,
      `midd5 called only once, called: ${midd5.callCount}`,
    );
    assert.ok(
      midd6.calledOnce,
      `midd6 called only once, called: ${midd6.callCount}`,
    );
    assert.ok(
      middFinal.calledOnce,
      `middFinal called only once, called: ${middFinal.callCount}`,
    );
    assert.ok(fnPayload.calledOnce, 'fnPayload called only once');

    assert.ok(midd1.calledBefore(midd2), '"midd1" called before "midd2"');
    assert.ok(midd2.calledBefore(midd3), '"midd2" called before "midd3"');
    assert.ok(
      midd3.calledBefore(fnPayload),
      '"midd3" called before "fnPayload"',
    );
    assert.ok(
      fnPayload.calledBefore(midd4),
      '"fnPayload" called before "midd4"',
    );
    assert.ok(midd4.calledBefore(midd5), '"midd4" called before "midd5"');
    assert.ok(midd5.calledBefore(midd6), '"midd5" called before "midd6"');
    assert.ok(
      midd6.calledBefore(middFinal),
      '"midd6" called before "middFinal"',
    );
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
  let obj;
  let mainMidd;
  let firstMidd;
  let secondMidd;
  let thirdMidd;
  let lastMidd;

  test('6.3.1 Three arguments', function() {
    obj = Object.create(null);
    mainMidd = sinon.spy();
    firstMidd = sinon.spy();
    secondMidd = sinon.spy();
    thirdMidd = sinon.spy();
    lastMidd = sinon.spy();
    midd.make(obj, 'create', mainMidd, { beforeAfter: true });
    obj.create.before(firstMidd, secondMidd);
    obj.create.after(thirdMidd);
    obj.create.last(lastMidd);

    const foo = { a: 1 };
    const bar = { b: 2 };
    obj.create(1, foo, bar);
    assert.ok(
      firstMidd.alwaysCalledWith(1, foo, bar),
      'firstMidd should be invoked with these arguments',
    );
    assert.ok(
      secondMidd.alwaysCalledWith(1, foo, bar),
      'secondMidd should be invoked with these arguments',
    );
    assert.ok(
      thirdMidd.alwaysCalledWith(1, foo, bar),
      'thirdMidd should be invoked with these arguments',
    );
    assert.ok(
      mainMidd.alwaysCalledWith(1, foo, bar),
      'mainMidd should be invoked with these arguments',
    );
    assert.ok(
      lastMidd.alwaysCalledWith(1, foo, bar),
      'lastMidd should be invoked with these arguments',
    );
  });
  suite('6.3.2 Main Callback return value is what is returned', function() {
    function setupMiddleware(returnValue) {
      obj = Object.create(null);
      mainMidd = function() {
        return returnValue;
      };
      firstMidd = sinon.spy();
      secondMidd = sinon.spy();
      thirdMidd = sinon.spy();
      midd.make(obj, 'create', mainMidd, { beforeAfter: true });
      obj.create.before(firstMidd, secondMidd);
      obj.create.after(thirdMidd);
    }
    test('6.3.2.2 Using a string', function() {
      setupMiddleware('value');
      const val = obj.create();
      assert.equal(val, 'value');
    });
    test('6.3.2.3 Using a number', function() {
      setupMiddleware(9);
      const val = obj.create();
      assert.equal(val, 9);
    });
  });
});

suite('6.5. Failing middleware cases', function() {
  let obj;
  setup(function() {
    obj = Object.create(null);
    midd.make(obj, 'create', { beforeAfter: true });
  });
  test('6.5.1.1 Before middleware throws an error', function() {
    obj.create.before(function() {
      throw new Error('an error');
    });

    assert.throws(obj.create, 'an error');
  });

  test('6.5.1.1.2 After middleware throws an error', function() {
    obj.create.after(function() {
      throw new Error('an error');
    });
    assert.throws(obj.create, 'an error');
  });

  test('6.5.1.2 Main callback throws an error', function() {
    const custObj = Object.create(null);
    midd.make(
      custObj,
      'create',
      function() {
        throw new Error('an error');
      },
      { beforeAfter: true },
    );

    assert.throws(custObj.create, 'an error');
  });
});
suite('6.6. Return Value propagation to After middl', function() {
  let obj;
  setup(function() {
    obj = Object.create(null);
  });
  test('6.6.1 Returning value from main callback gets passed as an extra argument to the after middleware', function() {
    midd.make(
      obj,
      'create',
      function() {
        return 'abc';
      },
      { beforeAfter: true },
    );

    obj.create.after(function(arg1, arg2, resolveValue) {
      assert.equal(resolveValue, 'abc');
    });
    const returnVal = obj.create(1, 2);
    assert.equal(returnVal, 'abc');
  });
});

suite(
  '6.8 Returning Value can be altered by After & Last middleware',
  function() {
    let obj;
    setup(function() {
      obj = Object.create(null);
    });
    test('6.8.1 After middleware can alter outcome ASYNC', function() {
      midd.make(
        obj,
        'create',
        function() {
          return 'abc';
        },
        { beforeAfter: true },
      );

      obj.create.after(function() {
        return 'def';
      });
      obj.create.after(function(returnValue) {
        assert.equal(returnValue, 'def');
      });

      const result = obj.create();
      assert.equal(result, 'def');
    });
    test('6.8.3 Last middleware can alter final return value', function() {
      midd.make(
        obj,
        'create',
        function() {
          return 'abc';
        },
        { beforeAfter: true },
      );

      obj.create.last(function() {
        return 'def';
      });
      obj.create.last(function(resolveValue) {
        assert.equal(resolveValue, 'def');
      });

      const retVal = obj.create();
      assert.equal(retVal, 'def');
    });
  },
);
