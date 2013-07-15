/**
 * @fileOverview Apply the middleware pattern to a given Object.
 */

var __ = require('lodash');

var middlewarify = module.exports = {};

var noop = function() {};
var noopMidd = function(cb) {if (__.isFunction(cb)) cb();};

/**
 * Apply the middleware pattern to the provided object's propert.
 *
 * @param  {Object} obj An Object.
 * @param  {string} prop The property to apply the middleware pattern on.
 * @param  {Function=} optFinalCb Last middleware to call.
 */
middlewarify.make = function(obj, prop, optFinalCb) {

  var middObj = Object.create(null);
  middObj.midds = [];
  middObj.finalMidd = noopMidd;
  if (__.isFunction(optFinalCb)) {
    middObj.finalMidd = optFinalCb;
  }

  obj[prop] = middlewarify._runAll.bind(null, middObj);
  obj[prop].use = middlewarify._use.bind(null, middObj);
};

/**
 * Invokes all the middleware.
 * @param  {Object} middObj Internal midd object.
 * @param  {*...} varArgs Any number of arguments
 * @param  {Function=} optCb last argument is callback
 * @private
 */
middlewarify._runAll = function(middObj) {
  var args = Array.prototype.slice.call(arguments, 1);

  var len = args.length;

  var done = noop;

  if (__.isFunction(args[len - 1])) {
    done = args.pop();
  }

  var midds = Array.prototype.slice.call(middObj.midds, 0);
  midds.push(middObj.finalMidd);

  middlewarify._fetchAndInvoke(midds, args, done);
};

/**
 * Fetch a middleware ensuring FIFO and invoke it.
 *
 * @param {Array.<Function>} midds The array with the middleware.
 * @param {Array} args An array of arbitrary arguments, can be empty.
 * @param {Function} done Callback.
 * @param {...*} optMiddArgs Arguments passed from the last middleware.
 * @private
 */
middlewarify._fetchAndInvoke = function(midds, args, done, optMiddArgs) {
  var lastMiddArgs = optMiddArgs || [];

  if (0 === midds.length) {
    lastMiddArgs.unshift(null);
    return done.apply(null, lastMiddArgs);
  }
  try {
    var midd = midds.shift();
    midd.apply(null, args.concat(function(err){
      if (err) {
        done(err);
      } else {
        var middArgs = Array.prototype.slice.call(arguments, 1);
        middlewarify._fetchAndInvoke(midds, args, done, middArgs);
      }
    }));
  } catch(ex) {
    done(ex);
  }
};

/**
 * Add middleware.
 *
 * @param  {Object} middObj Internal midd object.
 * @param {Function|Array.<Function>...} Any combination of function containers.
 * @private
 */
middlewarify._use = function(middObj) {
  var args = Array.prototype.slice.call(arguments, 1);

  var len = args.length;
  if (0 === len) return;

  args.forEach(function(argItem) {
    if (Array.isArray(argItem)) {
      argItem.forEach(function(argFn) {
        if (__.isFunction(argFn)) {
          middObj.midds.push(argFn);
        }
      });
    } else if (__.isFunction(argItem)) {
      middObj.midds.push(argItem);
    }
  });
};
