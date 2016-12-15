import Endpoint from '../endpoint';

/**
 * API endpoint to manipulate and interact with your destiny character.
 *
 * @constructor
 * @param {Destiny} destiny Reference to the destiny API.
 * @api private
 */
export default class Character extends Endpoint {
  constructor() {
    super(...arguments);

    this.base = 'Destiny/{platform}/Account/{id}/Character/';
    this.generate(Character.specification)
  }
}

/**
 * Generate the following API methods which should request the given suffix
 * API's
 *
 * @type {Object}
 * @private
 */
Character.specification = {
  main: '',
  inventory: 'Inventory',
  activities: 'Activities',
  progression: 'Progression'
};
