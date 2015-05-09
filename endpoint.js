'use strict';

/**
 * Base endpoint class which makes it a bit easier.
 *
 * @constructor
 * @param {Destiny} destiny Reference to the destiny API.
 * @api private
 */
function Endpoint(destiny) {
  this.destiny = destiny;

  Object.keys(this.generate).forEach(function each(method) {
    var suffix = this.generate[method];

    /**
     * Generate a proxy method which will automatically request all the things
     * on the said endpoints.
     *
     * @param {String|Number} id Identifier that should be here.
     * @param {Function} fn Completion callback.
     * @api public
     */
    this[method] = function generated(id, fn) {
      return this.send(id + suffix, {
        method: 'GET'
      }, fn);
    };
  }, this);
}

/**
 * Base URL string. Please note that it should _always_ end with an `/`.
 *
 * @type {String}
 * @public
 */
Endpoint.prototype.base = 'Destiny/';

/**
 * API endpoints that need to be generated. Should be an object who's keys are
 * stored as: <fn.name> > <Suffix>
 *
 * @type {Object}
 * @public
 */
Endpoint.prototype.generate = {};

/**
 * @param {String} url The URL that we need to reach, without base.
 * @param {Object} options Additional configuration.
 * @param {Function} fn Completion callback.
 * @api private
 */
Endpoint.prototype.send = function send(url, options, fn) {
  var destiny = this.destiny;

  return destiny.send(destiny.merge({
    url: destiny.format(this.base + url)
  }, options), fn);
};

//
// Simple helper function to extend on the things.
//
Endpoint.extend = require('extendible');

//
// Expose the Endpoint API.
//
module.exports = Endpoint;
