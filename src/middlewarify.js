/**
 * @fileoverview Apply the middleware pattern to a given Object.
 */

const { make } = require('./make');

const middlewarify = (module.exports = {});

middlewarify.make = make;
