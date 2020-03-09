/**
 * @fileoverview Apply the middleware pattern to a given Object.
 */

const __ = require('lodash');

const middlewarify = (module.exports = {});

const noopMidd = function(cb) {
  if (__.isFunction(cb)) {
    cb();
  }
};

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
 * @param {boolean=} optParams.beforeAfter set to true to add Before/After hooks
 *     instead of the single use hook.
 * @param {Function=} optParams.catchAll Error catchall function.
 * @param {boolean=} optParams.async Set to true to enable async mode.
 */
middlewarify.make = function(obj, prop, optFinalCb, optParams) {
  const middObj = middlewarify.newMidd();

  if (__.isFunction(optFinalCb)) {
    middObj.mainCallback = optFinalCb;
    middObj.mainCallback.isMain = true;
  }

  let params;
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
  const defaultParams = {
    beforeAfter: false,
    catchAll: null,
    async: false,
  };
  middObj.params = __.extend(defaultParams, params);

  obj[prop] = middlewarify._invokeMiddleware.bind(null, middObj);

  if (middObj.params.beforeAfter) {
    middObj.beforeMidds = [];
    middObj.afterMidds = [];
    middObj.lastMidds = [];
    obj[prop].before = middlewarify._use.bind(
      null,
      middObj,
      middlewarify.Type.BEFORE,
    );
    obj[prop].after = middlewarify._use.bind(
      null,
      middObj,
      middlewarify.Type.AFTER,
    );
    obj[prop].last = middlewarify._use.bind(
      null,
      middObj,
      middlewarify.Type.LAST,
    );
  } else {
    middObj.midds = [];
    obj[prop].use = middlewarify._use.bind(
      null,
      middObj,
      middlewarify.Type.USE,
    );
  }
};

/**
 * Create and initialize a new Middleware Object.
 *
 * @return {Object} A new Middleware Object.
 */
middlewarify.newMidd = function() {
  const middObj = Object.create(null);
  middObj.mainCallback = noopMidd;
  middObj.mainCallback.isMain = true;

  return middObj;
};

/**
 * Invokes all the middleware.
 *
 * @param  {Object} middObj Internal midd object.
 * @param  {...*} args Any number of arguments
 * @return {*|Promise} Middleware value or A promise.
 * @private
 */
middlewarify._invokeMiddleware = (middObj, ...args) => {
  const midds = middlewarify._prepareMiddleware(middObj);

  const invokeState = {
    mainCallbackReturnValue: null,
  };
  if (middObj.params.async === true) {
    try {
      return middlewarify
        ._asyncShiftAndInvoke(midds, args, invokeState)
        .catch(middlewarify._handleInvokeError.bind(null, middObj));
    } catch (ex) {
      middlewarify._handleInvokeError(middObj, ex);
    }
  }

  try {
    return middlewarify._syncShiftAndInvoke(midds, args, invokeState);
  } catch (ex) {
    middlewarify._handleInvokeError(middObj, ex);
  }
};

/**
 * Handles invokation error, will check if a catchAll exists.
 *
 * @param {Object} middObj Internal middleware state.
 * @param {Error} ex Error cought.
 * @throws {Error} if no error catchAll was found.
 * @private
 */
middlewarify._handleInvokeError = (middObj, ex) => {
  if (typeof middObj.params.catchAll === 'function') {
    middObj.params.catchAll(ex);
  } else {
    throw ex;
  }
};

/**
 * Prepares the sequence of middleware to be invoked and returns them in
 * order of invocation in an array.
 *
 * @param {Object} middObj Internal middleware state.
 * @return {Array.<Function>} The middleware to be invoked in sequence.
 * @private
 */
middlewarify._prepareMiddleware = middObj => {
  let midds;
  if (middObj.params.beforeAfter) {
    midds = Array.prototype.slice.call(middObj.beforeMidds);
    midds.push(middObj.mainCallback);
    midds = midds.concat(middObj.afterMidds, middObj.lastMidds);
  } else {
    midds = Array.prototype.slice.call(middObj.midds);
    midds.push(middObj.mainCallback);
  }

  return midds;
};

/**
 * SYNCHRONOUS & RECURSIVE.
 * Shifts one middleware from the array ensuring FIFO and invokes it.
 *
 * @param {Array.<Function>} midds The middleware.
 * @param {Array} args An array of arbitrary arguments, can be empty.
 * @param {Object} invokeState The current invocation state.
 * @param {boolean=} optAfter If next middleware is after the main callback.
 * @return {Promise} A promise.
 * @private
 */
middlewarify._syncShiftAndInvoke = function(
  midds,
  args,
  invokeState,
  optAfter,
) {
  if (!midds.length) {
    return invokeState.mainCallbackReturnValue;
  }

  let isAfter = !!optAfter;

  const midd = midds.shift();

  const retVal = midd(...args);

  // If a function is of type "after" (invoked after the main fn)
  // then we use its return value -if one exists- as the value to be returned
  // for the entire middleware invocation.
  if (isAfter && typeof retVal !== 'undefined') {
    invokeState.mainCallbackReturnValue = retVal;
    args.splice(-1, 1, retVal);
  }

  if (midd.isMain) {
    invokeState.mainCallbackReturnValue = retVal;
    args.push(retVal);
    isAfter = true;
  }

  return middlewarify._syncShiftAndInvoke(midds, args, invokeState, isAfter);
};

/**
 * ASYNCHRONOUS & RECURSIVE
 * Shifts one middleware from the array ensuring FIFO and invokes it.
 *
 * @param {Array.<Function>} midds The middleware.
 * @param {Array} args An array of arbitrary arguments, can be empty.
 * @param {Object} invokeState The current invocation state.
 * @param {boolean=} optAfter If next middleware is after the main callback.
 * @return {Promise} A promise with the ultimate response.
 * @private
 */
middlewarify._asyncShiftAndInvoke = async function(
  midds,
  args,
  invokeState,
  optAfter,
) {
  if (!midds.length) {
    return invokeState.mainCallbackReturnValue;
  }

  let isAfter = !!optAfter;

  const midd = midds.shift();

  const retVal = await midd(...args);

  // If a function is of type "after" (invoked after the main fn)
  // then we use its return value -if it exists- as the value to be returned
  // for the entire middleware invocation.
  if (isAfter && typeof val !== 'undefined') {
    invokeState.mainCallbackReturnValue = retVal;
    args.splice(-1, 1, retVal);
  }

  if (midd.isMain) {
    invokeState.mainCallbackReturnValue = retVal;
    args.push(retVal);
    isAfter = true;
  }

  return middlewarify._asyncShiftAndInvoke(midds, args, invokeState, isAfter);
};

/**
 * Add middleware.
 *
 * @param {Object} middObj Internal midd object.
 * @param {middlewarify.Type} middType Middleware type.
 * @param {Function|Array.<Function>...} middlewares Any combination of
 *    function containers.
 * @private
 */
middlewarify._use = function(middObj, middType, ...middlewares) {
  const len = middlewares.length;
  if (len === 0) {
    return;
  }

  /**
   * @param {Function} fn Middleware function.
   */
  function pushMidd(fn) {
    switch (middType) {
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
      default:
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
