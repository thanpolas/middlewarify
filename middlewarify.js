/**
 * @fileOverview Apply the middleware pattern to a given Object.
 */

var __ = require('lodash');
var Promise = require('bluebird');

var middlewarify = module.exports = {};

var noopMidd = function(cb) {if (__.isFunction(cb)) cb();};

/** @enum {string} middleware types */
middlewarify.Type = {
  BEFORE: 'before',
  AFTER: 'after',
  LAST: 'last',
  USE: 'use',
};

/**
 * Apply the middleware pattern to the provided object's propert.
 *
 * @param {Object} obj An Object.
 * @param {string} prop The property to apply the middleware pattern on.
 * @param {Function=} optFinalCb Last middleware to call.
 * @param {Object=} optParams Optional parameters.
 *   @param {boolean=} beforeAfter set to true to add Before/After hooks
 *     instead of the single use hook.
 */
middlewarify.make = function(obj, prop, optFinalCb, optParams) {

  var middObj = middlewarify.newMidd();

  if (__.isFunction(optFinalCb)) {
    middObj.mainCallback = optFinalCb;
    middObj.mainCallback.isMain = true;
  }

  var params;
  if (__.isObject(optFinalCb)) {
    params = optFinalCb;
  }
  if (__.isObject(optParams)) {
    params = optParams;
  }

  /**
   * The default parameters object.
   *
   * @type {Object}
   */
  var defaultParams = {
    beforeAfter: false,
    catchAll: null,
  };
  middObj.params = __.extend(defaultParams, params);

  obj[prop] = middlewarify._invokeMiddleware.bind(null, middObj);

  if (middObj.params.beforeAfter) {
    middObj.beforeMidds = [];
    middObj.afterMidds = [];
    middObj.lastMidds = [];
    obj[prop].before = middlewarify._use.bind(null, middObj, middlewarify.Type.BEFORE);
    obj[prop].after = middlewarify._use.bind(null, middObj, middlewarify.Type.AFTER);
    obj[prop].last = middlewarify._use.bind(null, middObj, middlewarify.Type.LAST);
  } else {
    middObj.midds = [];
    obj[prop].use = middlewarify._use.bind(null, middObj, middlewarify.Type.USE);
  }
};

/**
 * Create an initialize a new Middleware Object.
 *
 * @return {Object} A new Middleware Object.
 */
middlewarify.newMidd = function() {
  var middObj = Object.create(null);
  middObj.mainCallback = noopMidd;
  middObj.mainCallback.isMain = true;

  return middObj;
};

/**
 * Invokes all the middleware.
 *
 * @param  {Object} middObj Internal midd object.
 * @param  {*...} varArgs Any number of arguments
 * @return {Promise} A promise.
 * @private
 */
middlewarify._invokeMiddleware = function(middObj) {
  var args = Array.prototype.slice.call(arguments, 1);
  return new Promise(function(resolve, reject) {
    var midds;
    if (middObj.params.beforeAfter) {
      midds = Array.prototype.slice.call(middObj.beforeMidds);
      midds.push(middObj.mainCallback);
      midds = midds.concat(middObj.afterMidds, middObj.lastMidds);
    } else {
      midds = Array.prototype.slice.call(middObj.midds);
      midds.push(middObj.mainCallback);
    }

    var store = {
      mainCallbackReturnValue: null,
    };
    var deferred = {
      resolve: resolve,
      reject: reject,
    };
    middlewarify._fetchAndInvoke(midds, args, store, deferred);
  }).catch(function(err) {
    // check for catchAll error handler.
    if (typeof middObj.params.catchAll === 'function') {
      middObj.params.catchAll(err);
    } else {
      throw err;
    }
  });
};

/**
 * Fetch a middleware ensuring FIFO and invoke it.
 *
 * @param {Array.<Function>} midds The middleware.
 * @param {Array} args An array of arbitrary arguments, can be empty.
 * @param {Object} store use as store.
 * @param {Object} deferred contains resolve, reject fns.
 * @param {boolean=} optAfter If next middleware is after the main callback.
 * @return {Promise} A promise.
 * @private
 */
middlewarify._fetchAndInvoke = function(midds, args, store, deferred, optAfter) {
  if (!midds.length) {
    return deferred.resolve(store.mainCallbackReturnValue);
  }

  var isAfter = !!optAfter;

  var midd = midds.shift();
  Promise.try(midd, args)
    .then(function(val) {
      // check for return value and after-main CB
      // if pass then replace the main callback return value with the one
      // provided
      if (isAfter && typeof val !== 'undefined') {
        store.mainCallbackReturnValue = val;
        args.splice(-1, 1, val);
      }

      if (midd.isMain) {
        store.mainCallbackReturnValue = val;
        args.push(val);
        isAfter = true;
      }

      middlewarify._fetchAndInvoke(midds, args, store, deferred, isAfter);
    })
    .catch(function(err) {
      deferred.reject(err);
    });
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
  if (len === 0) return;

  function pushMidd(fn) {
    switch(middType) {
    case middlewarify.Type.BEFORE:
      middObj.beforeMidds.push(fn);
      break;
    case middlewarify.Type.AFTER:
      middObj.afterMidds.push(fn);
      break;
    case middlewarify.Type.LAST:
      middObj.lastMidds.push(fn);
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
