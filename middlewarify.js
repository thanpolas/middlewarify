/**
 * @fileOverview Apply the middleware pattern to a given Object.
 */

var __ = require('lodash');

var middlewarify = module.exports = {};

var noop = function() {};

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
  if (__.isFunction(optFinalCb)) {
    middObj.midds.push(optFinalCb);
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

  middlewarify.popAndInvoke(midds);

};

/**
 * Pop a middleware and invoke it.
 *
 * @param {Array.<Function>} midds The array with the middleware.
 * @param {Array} args An array of arbitrary arguments, can be empty.
 * @param {Function} done Callback.
 * @private
 */
middlewarify._popAndInvoke = function(midds, args, done) {
  if (0 === midds.length) {
    return done();
  }
  try {
    var midd = midds.pop();
    midd.apply(null, args.concat(function(err){
      if (err) {
        done(err);
      } else {
        middlewarify.popAndInvoke(midds, args, done);
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

  args.forEach(function(argItem){
    if (Array.isArray(argItem)) {
      argItem.forEach(function(argFn){
        if (__.isFunction(argFn)) {
          middObj.push(argFn);
        }
      });
    } else if (__.isFunction(argItem)) {
      middObj.push(argItem);
    }
  });
};
