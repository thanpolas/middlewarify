/**
 * @fileOverview Promise Interface tests
 */
var sinon  = require('sinon');
var assert = require('chai').assert;
var Promise = require('bluebird');

var midd = require('../');

var noop = function(){};

suite('7. Promise Interface', function() {
  var thing;

  teardown(function() {});


  // The numbering (e.g. 1.1.1) has nothing to do with order
  // The purpose is to provide a unique string so specific tests are
  // run by using the mocha --grep "1.1.1" option.


  function applyTests(num, middMethod, thing) {
    setup(function() {
      var middOpts = {};

      if (middMethod !== 'use') {
        middOpts = {beforeAfter: true};
      }
      thing = Object.create(null);
      midd.make(thing, 'create', function() {
        return Promise.resolve();
      }, middOpts);

    });

    test('7.' + num + '.1 accepts a promise', function(done) {
      thing.create[middMethod](function() {
        return new Promise(function(resolve) {
          resolve();
        });
      });
      thing.create().then(done, done);
    });
    test('7.' + num + '.2 propagates error', function(done) {
      thing.create[middMethod](function() {
        return new Promise(function(resolve, reject) {
          reject();
        });
      });
      thing.create().then(noop, done.bind(null, null));

    });
    test('7.' + num + '.3 propagates error message', function(done) {
      thing.create[middMethod](function() {
        return new Promise(function(resolve, reject) {
          reject('Error');
        });
      });
      thing.create().then(null, function(err) {
        assert.equal(err, 'Error');
        done();
      }).then(null, done);
    });
    test('7.' + num + '.4 arguments propagate', function(done) {
      thing.create[middMethod](function(arg1) {
        return new Promise(function(resolve) {
          assert.equal(arg1, 1);
          resolve();
        });
      });
      thing.create[middMethod](function(arg1) {
        return new Promise(function(resolve) {
          assert.equal(arg1, 1);
          resolve();
        });
      });

      thing.create(1).then(done, done);
    });
  }

  suite('7.1 Middleware with use()', function() {
    applyTests(1, 'use', thing);
  });
  suite('7.2 Middleware with before()', function() {
    var thing = Object.create(null);
    midd.make(thing, 'create', function() {
      return Promise.resolve();
    }, {beforeAfter: true});
    applyTests(2, 'before', thing);
  });
  suite('7.3 Middleware with after()', function() {
    var thing = Object.create(null);
    midd.make(thing, 'create', function() {
      return Promise.resolve();
    }, {beforeAfter: true});
    applyTests(3, 'after', thing);
  });
  suite('7.8 Middleware with use() check', function() {
    var thing = Object.create(null);
    midd.make(thing, 'create', function() {
      return Promise.resolve();
    });

    test('7.8.3 propagates error message', function(done) {
      thing.create.use(function() {
        return new Promise(function(resolve, reject) {
          reject('Error');
        });
      });
      thing.create().then(null, function(err) {
        assert.equal(err, 'Error');
        done();
      }).then(null, done);
    });
  });

});
