/**
 * Base endpoint class which makes it a bit easier.
 *
 * @constructor
 * @param {Destiny} destiny Reference to the destiny API.
 * @api private
 */
export default class Endpoint {
  constructor(destiny) {
    this.destiny = destiny;
    this.base = 'Destiny/';
  }

  /**
   * Generate API calls based on the given object specification. This makes
   * creating of common API and the handling of it a lot easier.
   *
   * @param {Object} api API specification.
   * @private
   */
  generate(api) {
    Object.keys(api).forEach((method) => {
      var suffix = api[method];

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
    });
  }

  /**
   * @param {String} url The URL that we need to reach, without base.
   * @param {Object} options Additional configuration.
   * @param {Function} fn Completion callback.
   * @api private
   */
  send(url, options, fn) {
    var destiny = this.destiny;

    return destiny.send(destiny.merge({
      url: destiny.format(this.base + url)
    }, options), fn);
  }
}
