/**
 * @fileOverview Promise Interface tests
 */
var sinon  = require('sinon');
var assert = require('chai').assert;
var Promise = require('bluebird');

var midd = require('../');

var noop = function(){};

suite('7. Promise Interface', function() {

  setup(function() {});

  teardown(function() {});


  // The numbering (e.g. 1.1.1) has nothing to do with order
  // The purpose is to provide a unique string so specific tests are
  // run by using the mocha --grep "1.1.1" option.


  function applyTests(num, middMethod, invokeMethod) {
    test('7.' + num + '.1 accepts a promise', function(done) {
      middMethod(function() {
        return new Promise(function(resolve) {
          resolve();
        });
      });
      invokeMethod().then(done, done);
    });
    test('7.' + num + '.2 propagates error', function(done) {
      middMethod(function() {
        return new Promise(function(resolve, reject) {
          reject();
        });
      });
      invokeMethod().then(noop, done.bind(null, null));
    });
    test('7.' + num + '.3 propagates error message', function(done) {
      middMethod(function() {
        return new Promise(function(resolve, reject) {
          reject('Error');
        });
      });
      invokeMethod().then(noop, function(err) {
        assert.equal(err, 'Error');
        done();
      }).then(null, done);
    });
    test('7.' + num + '.4 arguments propagate', function(done) {
      middMethod(function(arg1) {
        return new Promise(function(resolve) {
          assert.equal(arg1, 1);
          resolve();
        });
      });
      middMethod(function(arg1) {
        return new Promise(function(resolve) {
          assert.equal(arg1, 1);
          resolve();
        });
      });

      invokeMethod(1).then(done, done);
    });
  }

  suite('7.1 Middleware with use()', function() {
    var obj = Object.create(null);
    midd.make(obj, 'create', function() {
      return Promise.resolve();
    });
    applyTests(1, obj.create.use, obj.create);
  });
  suite('7.2 Middleware with before()', function() {
    var obj = Object.create(null);
    midd.make(obj, 'create', function() {
      return Promise.resolve();
    }, {beforeAfter: true});
    applyTests(1, obj.create.before, obj.create);
  });
  suite('7.3 Middleware with after()', function() {
    var obj = Object.create(null);
    midd.make(obj, 'create', function() {
      return Promise.resolve();
    }, {beforeAfter: true});
    applyTests(1, obj.create.after, obj.create);
  });
});
