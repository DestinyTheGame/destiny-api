'use strict';

var Endpoint = require('../endpoint');

/**
 * API endpoint to manipulate and interact with your destiny character.
 *
 * @constructor
 * @param {Destiny} destiny Reference to the destiny API.
 * @api private
 */
module.exports = Endpoint.extend({
  /**
   * The base URL that we need to request.
   *
   * @type {String}
   * @private
   */
  base: 'Destiny/{platform}/Account/{id}/Character/',

  /**
   * Generate the following API methods which should request the given suffix
   * API's
   *
   * @type {Object}
   * @private
   */
  generate: {
    main: '',
    inventory: 'Inventory',
    activities: 'Activities',
    progression: 'Progression'
  }
});
