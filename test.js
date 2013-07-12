/**
 * @fileOverview middlewarify tests
 */

// var sinon  = require('sinon');
// var chai = require('chai');
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

});