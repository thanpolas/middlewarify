/**
 * @fileOverview Apply the middleware pattern to a given Object.
 */

var __ = require('lodash');

var middlewarify = module.exports = {};

var noop = function() {};
var noopMidd = function(cb) {if (__.isFunction(cb)) cb();};

/** @enum {string} middleware types */
middlewarify.Type = {
  BEFORE: 'before',
  AFTER: 'after',
  USE: 'use',
};

/**
 * Apply the middleware pattern to the provided object's propert.
 *
 * @param {Object} obj An Object.
 * @param {string} prop The property to apply the middleware pattern on.
 * @param {Function=} optFinalCb Last middleware to call.
 * @param {Object=} optParams Optional parameters.
 *   @param {boolean=} throwErrors default is true.
 */
middlewarify.make = function(obj, prop, optFinalCb, optParams) {

  var middObj = Object.create(null);
  middObj.mainCallback = noopMidd;

  /**
   * The default parameters object.
   *
   * @type {Object}
   */
  middObj.params = {
    throwErrors: true,
    beforeAfter: false,
  };

  if (__.isFunction(optFinalCb)) {
    middObj.mainCallback = optFinalCb;
  }
  if (__.isObject(optFinalCb)) {
    __.defaults(middObj.params, optFinalCb);
  }
  if (__.isObject(optParams)) {
    __.defaults(middObj.params, optParams);
  }

  obj[prop] = middlewarify._invokeMiddleware.bind(null, middObj);

  if (middObj.params.beforeAfter) {
    middObj.beforeMidds = [];
    middObj.afterMidds = [];
    obj[prop].before = middlewarify._use.bind(null, middObj, middlewarify.Type.BEFORE);
    obj[prop].after = middlewarify._use.bind(null, middObj, middlewarify.Type.AFTER);
  } else {
    middObj.midds = [];
    obj[prop].use = middlewarify._use.bind(null, middObj, middlewarify.Type.USE);
  }
};

/**
 * Invokes all the middleware.
 * @param  {Object} middObj Internal midd object.
 * @param  {*...} varArgs Any number of arguments
 * @param  {Function=} optCb last argument is callback
 * @return {Object} the -master- callback using done(fn).
 * @private
 */
middlewarify._invokeMiddleware = function(middObj) {
  var args = Array.prototype.slice.call(arguments, 1);

  var doneArgs;
  var isDone = false;
  var doneActual = noop;
  var done = function() {
    isDone = true;
    doneArgs = arguments;
    doneActual.apply(null, arguments);
  };

  var midds;
  if (middObj.params.beforeAfter) {
    midds = Array.prototype.slice.call(middObj.beforeMidds, 0);
    midds.push(middObj.mainCallback);
    midds.concat(middObj.afterMidds);
  } else {
    midds = Array.prototype.slice.call(middObj.midds, 0);
    midds.push(middObj.mainCallback);
  }
  middlewarify._fetchAndInvoke(midds, args, middObj.params, done);

  return {done: function(fn) {
    if (isDone) {
      fn.apply(null, doneArgs);
    } else {
      doneActual = fn;
    }
  }};
};

/**
 * Fetch a middleware ensuring FIFO and invoke it.
 *
 * @param {Array.<Function>} midds The array with the middleware.
 * @param {Array} args An array of arbitrary arguments, can be empty.
 * @param {Object} params Parameters passed by the user.
 * @param {Function} done Callback.
 * @param {...*} optMiddArgs Arguments passed from the last middleware.
 * @private
 */
middlewarify._fetchAndInvoke = function(midds, args, params, done, optMiddArgs) {
  var lastMiddArgs = optMiddArgs || [];

  if (0 === midds.length) {
    lastMiddArgs.unshift(null);
    return done.apply(null, lastMiddArgs);
  }

  var midd = midds.shift();
  try {
    midd.apply(null, args.concat(function(err){
      if (err) {
        done(err);
      } else {
        var middArgs = Array.prototype.slice.call(arguments, 1);
        middlewarify._fetchAndInvoke(midds, args, params, done, middArgs);
      }
    }));
  } catch(ex) {
    if (params.throwErrors) {
      throw ex;
    } else {
      done(ex);
    }
  }
};

/**
 * Add middleware.
 *
 * @param {Object} middObj Internal midd object.
 * @param {middlewarify.Type} middType Middleware type.
 * @param {Function|Array.<Function>...} Any combination of function containers.
 * @private
 */
middlewarify._use = function(middObj, middType) {
  var middlewares = Array.prototype.slice.call(arguments, 2);

  var len = middlewares.length;
  if (0 === len) return;

  function pushMidd(fn) {
    switch(middType) {
    case middlewarify.Type.BEFORE:
      middObj.beforeMidds.push(fn);
      break;
    case middlewarify.Type.AFTER:
      middObj.afterMidds.push(fn);
      break;
    case middlewarify.Type.USE:
      middObj.midds.push(fn);
      break;
    }
  }

  middlewares.forEach(function(middleware) {
    if (Array.isArray(middleware)) {
      middleware.forEach(function(argFn) {
        if (__.isFunction(argFn)) {
          pushMidd(argFn);
        }
      });
    } else if (__.isFunction(middleware)) {
      pushMidd(middleware);
    }
  });
};
