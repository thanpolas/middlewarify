/**
 * @fileoverview Implementation of the use() function.
 */

const __ = require('lodash');

const entity = (module.exports = {});

/** @enum {string} middleware types */
entity.UseType = {
  BEFORE: 'before',
  AFTER: 'after',
  LAST: 'last',
  USE: 'use',
};

/**
 * Add middleware.
 *
 * @param {Object} middObj Internal midd object.
 * @param {middlewarify.UseType} middType Middleware type.
 * @param {Function|Array.<Function>...} middlewares Any combination of
 *    function containers.
 */
entity.use = function (middObj, middType, ...middlewares) {
  const len = middlewares.length;
  if (len === 0) {
    return;
  }

  /**
   * @param {function} fn Middleware function.
   */
  function pushMidd(fn) {
    switch (middType) {
      case entity.UseType.BEFORE:
        middObj.beforeMidds.push(fn);
        break;
      case entity.UseType.AFTER:
        middObj.afterMidds.push(fn);
        break;
      case entity.UseType.LAST:
        middObj.lastMidds.push(fn);
        break;
      case entity.UseType.USE:
        middObj.midds.push(fn);
        break;
      default:
        break;
    }
  }

  middlewares.forEach(function (middleware) {
    if (Array.isArray(middleware)) {
      middleware.forEach(function (argFn) {
        if (__.isFunction(argFn)) {
          pushMidd(argFn);
        }
      });
    } else if (__.isFunction(middleware)) {
      pushMidd(middleware);
    }
  });
};
