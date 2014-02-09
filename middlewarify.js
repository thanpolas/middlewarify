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

  var middObj = Object.create(null);
  middObj.mainCallback = noopMidd;

  /**
   * The default parameters object.
   *
   * @type {Object}
   */
  var defaultParams = {
    beforeAfter: false,
  };

  if (__.isFunction(optFinalCb)) {
    middObj.mainCallback = optFinalCb;
  }

  var params;
  if (__.isObject(optFinalCb)) {
    params = optFinalCb;
  }
  if (__.isObject(optParams)) {
    params = optParams;
  }
  middObj.params = __.extend(defaultParams, params);

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
  return new Promise(function(resolve, reject) {
    var deferred = Promise.defer();
    deferred.promise.then(resolve, reject);
    var midds;
    if (middObj.params.beforeAfter) {
      midds = Array.prototype.slice.call(middObj.beforeMidds);
      midds.push(middObj.mainCallback);
      midds = midds.concat(middObj.afterMidds);
    } else {
      midds = Array.prototype.slice.call(middObj.midds);
      midds.push(middObj.mainCallback);
    }
    middlewarify._fetchAndInvoke(midds, args, deferred);
  });
};

/**
 * Fetch a middleware ensuring FIFO and invoke it.
 *
 * @param {Array.<Function>} midds The array with the middleware.
 * @param {Array} args An array of arbitrary arguments, can be empty.
 * @param {Promise.Defer} deferred Deferred object.
 * @private
 */
middlewarify._fetchAndInvoke = function(midds, args, deferred) {
  if (midds.length === 0) {
    return deferred.resolve();
  }

  var midd = midds.shift();
  middlewarify._invoke(midd, args).then(function() {
    middlewarify._fetchAndInvoke(midds, args, deferred);
  }, deferred.reject.bind(deferred));
};

/**
 * The actual invocation of the middleware happens here.
 *
 * @param {Function} midd The middleware to invoke.
 * @param {Array} invokeArgs Arguments to invoke middleware with.
 * @return {Promise}
 * @private
 */
middlewarify._invoke = function(midd, invokeArgs) {
  return new Promise(function(resolve, reject) {
    var maybePromise = midd.apply(null, invokeArgs);
    if (!maybePromise || typeof maybePromise.then !== 'function') {
      resolve();
    } else {
      maybePromise.then(resolve, reject);
    }
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
