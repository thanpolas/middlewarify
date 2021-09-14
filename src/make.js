/**
 * @fileoverview The make function of middlewarify, creates the middleware.
 */

const __ = require('lodash');

const { invokeMiddleware } = require('./invoke');
const { use, UseType } = require('./use');

const entity = (module.exports = {});

const noopMidd = function (cb) {
  if (__.isFunction(cb)) {
    cb();
  }
};

/**
 * Apply the middleware pattern to the provided object's property.
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
entity.make = function (obj, prop, optFinalCb, optParams) {
  const middObj = entity.newMidd();

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

  obj[prop] = invokeMiddleware.bind(null, middObj);

  if (middObj.params.beforeAfter) {
    middObj.beforeMidds = [];
    middObj.afterMidds = [];
    middObj.lastMidds = [];
    obj[prop].before = use.bind(null, middObj, UseType.BEFORE);
    obj[prop].after = use.bind(null, middObj, UseType.AFTER);
    obj[prop].last = use.bind(null, middObj, UseType.LAST);
  } else {
    middObj.midds = [];
    obj[prop].use = use.bind(null, middObj, UseType.USE);
  }
};

/**
 * Create and initialize a new Middleware Object.
 *
 * @return {Object} A new Middleware Object.
 */
entity.newMidd = function () {
  const middObj = Object.create(null);
  middObj.mainCallback = noopMidd;
  middObj.mainCallback.isMain = true;

  return middObj;
};
