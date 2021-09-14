/**
 * @fileoverview Invokes all middleware.
 */

const entity = (module.exports = {});

/**
 * Invokes all the middleware.
 *
 * @param  {Object} middObj Internal midd object.
 * @param  {...*} args Any number of arguments
 * @return {*|Promise} Middleware value or A promise.
 */
entity.invokeMiddleware = (middObj, ...args) => {
  if (middObj.params.concurrent) {
    return entity._invokeConcurrent(middObj, args);
  }

  const midds = entity._prepareMiddleware(middObj);

  const invokeState = {
    mainCallbackReturnValue: null,
  };
  if (middObj.params.async === true) {
    try {
      return entity
        ._asyncShiftAndInvoke(midds, args, invokeState)
        .catch(entity._handleInvokeError.bind(null, middObj));
    } catch (ex) {
      entity._handleInvokeError(middObj, ex);
    }
  }

  try {
    return entity._syncShiftAndInvoke(midds, args, invokeState);
  } catch (ex) {
    entity._handleInvokeError(middObj, ex);
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
entity._handleInvokeError = (middObj, ex) => {
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
entity._prepareMiddleware = (middObj) => {
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
entity._syncShiftAndInvoke = function (midds, args, invokeState, optAfter) {
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

  return entity._syncShiftAndInvoke(midds, args, invokeState, isAfter);
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
entity._asyncShiftAndInvoke = async function (
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
  if (isAfter && typeof retVal !== 'undefined') {
    invokeState.mainCallbackReturnValue = retVal;
    args.splice(-1, 1, retVal);
  }

  if (midd.isMain) {
    invokeState.mainCallbackReturnValue = retVal;
    args.push(retVal);
    isAfter = true;
  }

  return entity._asyncShiftAndInvoke(midds, args, invokeState, isAfter);
};

/**
 * Will execute all middleware concurrently.
 *
 * @param  {Object} middObj Internal midd object.
 * @param  {Array<*>} args Any number of arguments
 * @return {Promise<Array<Object>>} A Promise with the returned statuses and
 *    values.
 * @private
 */
entity._invokeConcurrent = async (middObj, args) => {
  const allMiddsPromises = middObj.midds.map((midd) => midd(...args));
  const res = Promise.allSettled(allMiddsPromises);

  return res;
};
