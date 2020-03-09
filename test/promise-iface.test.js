/**
 * @fileoverview Promise Interface tests
 */
const { assert } = require('chai');

const midd = require('../');

/**
 * Apply test suites with various parameters.
 *
 * @param {number} num The number of the test to use.
 * @param {string} middMethod The middlewarify method to be used.
 * @param {Object=} middOpts Options to create the middleware with.
 */
function applyTests(num, middMethod, middOpts) {
  let middleware;
  setup(function() {
    middleware = Object.create(null);
    midd.make(
      middleware,
      'create',
      function() {
        return Promise.resolve();
      },
      middOpts,
    );
  });

  test(`7.${num}.1 accepts a promise`, function(done) {
    middleware.create[middMethod](function() {
      return new Promise(function(resolve) {
        resolve();
      });
    });
    const retVal = middleware.create();
    retVal.then(done, done);
  });
  test(`7.${num}.2 propagates error`, function(done) {
    middleware.create[middMethod](function() {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          reject(new Error('poop'));
        });
      });
    });
    middleware.create().catch(function() {
      done();
    });
  });
  test(`7.${num}.3 propagates error message`, function(done) {
    middleware.create[middMethod](function() {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          reject(new Error('Error'));
        });
      });
    });
    middleware
      .create()
      .catch(function(err) {
        assert.equal(err.message, 'Error');
      })
      .then(done, done);
  });
  test(`7.${num}.4 arguments propagate`, function(done) {
    middleware.create[middMethod](function(arg1) {
      return new Promise(function(resolve) {
        assert.equal(arg1, 1);
        resolve();
      });
    });
    middleware.create[middMethod](function(arg1) {
      return new Promise(function(resolve) {
        assert.equal(arg1, 1);
        resolve();
      });
    });

    middleware.create(1).then(done, done);
  });

  test(`7.${num}.5 async resolution`, function(done) {
    let invoked = false;
    middleware.create[middMethod](function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          invoked = true;
          resolve();
        });
      });
    });
    middleware
      .create()
      .then(function() {
        assert.ok(invoked);
      })
      .then(done, done);
  });
  test(`7.${num}.6 async rejection`, function(done) {
    let invoked = false;
    middleware.create[middMethod](function() {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          invoked = true;
          reject();
        });
      });
    });
    middleware
      .create()
      .then(null, function() {
        assert.ok(invoked);
      })
      .then(done, done);
  });

  test(`7.${num}.7 async resolution for final callback`, function(done) {
    let invoked = false;
    middleware = Object.create(null);
    midd.make(
      middleware,
      'create',
      function() {
        return new Promise(function(resolve) {
          setTimeout(function() {
            invoked = true;
            resolve();
          });
        });
      },
      middOpts,
    );
    middleware
      .create()
      .then(function() {
        assert.ok(invoked);
      })
      .then(done, done);
  });
}

/**
 * Actual Testing Starts
 *
 *
 *
 *
 *
 *
 */

suite('7. Promise Interface', function() {
  suite('7.1 Middleware with use()', function() {
    applyTests(1, 'use', { async: true });
  });
  suite('7.2 Middleware with before()', function() {
    applyTests(2, 'before', { beforeAfter: true, async: true });
  });
  suite('7.3 Middleware with after()', function() {
    applyTests(3, 'after', { beforeAfter: true, async: true });
  });
  suite('7.8 Middleware with use() check', function() {
    const newMidd = Object.create(null);
    midd.make(
      newMidd,
      'create',
      function() {
        return Promise.resolve();
      },
      { async: true },
    );

    test('7.8.3 propagates error message', function(done) {
      newMidd.create.use(function() {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            reject(new Error('Error'));
          });
        });
      });
      newMidd
        .create()
        .then(null, function(err) {
          assert.equal(err.message, 'Error');
          done();
        })
        .then(null, done);
    });
  });
});
