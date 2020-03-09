/**
 * @fileoverview middlewarify tests
 */

const sinon = require('sinon');
const { assert } = require('chai');
const midd = require('../');

suite('1. Basic Tests', function() {
  test('1.1 Types Test', function() {
    const obj = Object.create(null);
    midd.make(obj, 'create');
    assert.isFunction(obj.create, 'obj.create should be a function');
    assert.isFunction(obj.create.use, 'obj.create.use should be a function');
  });
  test('1.2 Default return value', function() {
    const obj = Object.create(null);
    midd.make(obj, 'create');
    const ret = obj.create();
    assert.isUndefined(ret);
  });
});

suite('2. middleware.use() Sequence of invocation Synchronous', function() {
  let obj;
  let lastMidd;
  let firstMidd;
  let secondMidd;
  let thirdMidd;
  setup(function() {
    obj = Object.create(null);
    lastMidd = sinon.spy();
    firstMidd = sinon.spy();
    secondMidd = sinon.spy();
    thirdMidd = sinon.spy();
    midd.make(obj, 'create', lastMidd);
  });

  teardown(function() {
    obj.create();
    assert.ok(
      firstMidd.calledOnce,
      `firstMidd should be called only once. Called: ${firstMidd.callCount}`,
    );
    assert.ok(
      secondMidd.calledOnce,
      `secondMidd should be called only once. Called: ${secondMidd.callCount}`,
    );
    assert.ok(
      thirdMidd.calledOnce,
      `thirdMidd should be called only once. Called: ${thirdMidd.callCount}`,
    );
    assert.ok(
      lastMidd.calledOnce,
      `lastMidd should be called only once. Called: ${lastMidd.callCount}`,
    );

    assert.ok(
      firstMidd.calledBefore(secondMidd),
      'firstMidd should be called before secondMidd',
    );
    assert.ok(
      secondMidd.calledAfter(firstMidd),
      'secondMidd should be called after firstMidd',
    );
    assert.ok(
      thirdMidd.calledAfter(secondMidd),
      'thirdMidd should be called after secondMidd',
    );
    assert.ok(
      lastMidd.calledAfter(thirdMidd),
      'lastMidd should be called after thirdMidd',
    );
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
  let obj;
  let lastMidd;
  let firstMidd;
  let secondMidd;
  let thirdMidd;
  let spyLastMidd;
  let spyFirstMidd;
  let spySecondMidd;
  let spyThirdMidd;

  setup(function() {
    spyLastMidd = sinon.spy();
    spyFirstMidd = sinon.spy();
    spySecondMidd = sinon.spy();
    spyThirdMidd = sinon.spy();

    obj = Object.create(null);
    lastMidd = async function() {
      spyLastMidd();
    };
    firstMidd = async function() {
      spyFirstMidd();
    };
    secondMidd = async function() {
      spySecondMidd();
    };
    thirdMidd = async function() {
      spyThirdMidd();
    };

    midd.make(obj, 'create', lastMidd, { async: true });
  });

  teardown(async function() {
    await obj.create();
    assert.ok(spyFirstMidd.calledOnce, 'firstMidd should be called only once');
    assert.ok(
      spySecondMidd.calledOnce,
      'secondMidd should be called only once',
    );
    assert.ok(spyThirdMidd.calledOnce, 'thirdMidd should be called only once');
    assert.ok(spyLastMidd.calledOnce, 'lastMidd should be called only once');

    assert.ok(
      spyFirstMidd.calledBefore(spySecondMidd),
      'firstMidd should be called before secondMidd',
    );
    assert.ok(
      spySecondMidd.calledAfter(spyFirstMidd),
      'secondMidd should be called after firstMidd',
    );
    assert.ok(
      spyThirdMidd.calledAfter(spySecondMidd),
      'thirdMidd should be called after secondMidd',
    );
    assert.ok(
      spyLastMidd.calledAfter(spyThirdMidd),
      'lastMidd should be called after thirdMidd',
    );
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
  let obj;
  let lastMidd;
  let firstMidd;
  let secondMidd;
  let thirdMidd;

  teardown(function() {});

  test('3.1 Three arguments', function() {
    function checkMiddlewareArgs(arg1, arg2, arg3) {
      assert.equal(arg1, 1);
      assert.deepEqual(arg2, { a: 1 });
      assert.deepEqual(arg3, { b: 2 });
    }

    obj = Object.create(null);
    lastMidd = checkMiddlewareArgs;
    firstMidd = checkMiddlewareArgs;
    secondMidd = checkMiddlewareArgs;
    thirdMidd = checkMiddlewareArgs;
    midd.make(obj, 'create', lastMidd);
    obj.create.use(firstMidd, secondMidd, thirdMidd);

    const foo = { a: 1 };
    const bar = { b: 2 };
    obj.create(1, foo, bar);
  });
  test('3.2 Mutating arguments', function() {
    let count = 1;
    function checkMiddlewareArgs(foo, bar) {
      foo.a += 1;
      bar.b += 1;
      count += 1;
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

    const foo = { a: 1 };
    const bar = { b: 2 };
    obj.create(foo, bar);
  });
});

suite('4 middleware returning values should be ignored', function() {
  /**
   * Invokes the middleware.
   *
   * @param {*} returnValue Any value to be returned by the first middleware.
   * @return {*} Same type as returnValue.
   */
  function invoke(returnValue) {
    const lastMidd = function() {};
    const firstMidd = function() {
      return returnValue;
    };
    const obj = Object.create(null);
    midd.make(obj, 'create', lastMidd);
    obj.create.use(firstMidd);
    const ret = obj.create();
    return ret;
  }
  test('4.1 return undefined', function() {
    assert.isUndefined(invoke(undefined));
  });
  test('4.2 return null', function() {
    assert.isUndefined(invoke(null));
  });
  test('4.3 return void', function() {
    // eslint-disable-next-line no-void
    assert.isUndefined(invoke(void 0));
  });
  test('4.4 return boolean false', function() {
    assert.isUndefined(invoke(false));
  });
  test('4.5 return boolean true', function() {
    assert.isUndefined(invoke(true));
  });
  test('4.6 return empty object', function() {
    assert.isUndefined(invoke({}));
  });
  test('4.7 return string', function() {
    assert.isUndefined(invoke('one'));
  });
  test('4.8 return number', function() {
    assert.isUndefined(invoke(7));
  });
  test('4.9 return number 0', function() {
    assert.isUndefined(invoke(0));
  });
  test('4.10 return NaN', function() {
    // eslint-disable-next-line no-restricted-globals
    assert.isUndefined(invoke(NaN));
  });
  test('4.11 return empty Array', function() {
    assert.isUndefined(invoke([]));
  });
  test('4.12 return function', function() {
    const fn = function() {};
    assert.isUndefined(invoke(fn));
  });
  test('4.13 return regex', function() {
    const re = /a/;
    assert.isUndefined(invoke(re));
  });
  test('4.13 return Error instance', function() {
    const err = new Error('inst');
    assert.isUndefined(invoke(err));
  });
});

suite('5. Failing middleware cases', function() {
  let obj;
  setup(function() {
    obj = Object.create(null);
    midd.make(obj, 'create');
  });

  test('5.1.2 middleware accepts throw error', function() {
    const custObj = Object.create(null);
    midd.make(custObj, 'create');
    custObj.create.use(function() {
      throw new Error('an error');
    });

    try {
      custObj.create();
    } catch (ex) {
      assert.instanceOf(ex, Error, '"err" should be instanceOf Error');
      assert.equal(ex.message, 'an error', 'Error message should match');
    }
  });
  test('5.1.3 main callback accepts throw error', function() {
    const custObj = Object.create(null);
    midd.make(custObj, 'create', function() {
      throw new Error('an error');
    });
    try {
      custObj.create();
    } catch (ex) {
      assert.instanceOf(ex, Error, '"err" should be instanceOf Error');
      assert.equal(ex.message, 'an error', 'Error message should match');
    }
  });

  test('5.1.4 Catch All option', function() {
    const custObj = Object.create(null);
    midd.make(
      custObj,
      'create',
      function() {
        throw new Error('an error');
      },
      {
        catchAll: err => {
          assert.instanceOf(err, Error, '"err" should be instanceOf Error');
          assert.equal(err.message, 'an error', 'Error message should match');
        },
      },
    );
    custObj.create();
  });
});
