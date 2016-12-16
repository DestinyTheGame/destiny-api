/**
 * Representation of one of our Destiny characters.
 *
 * @constructor
 * @param {Destiny} destiny Reference to our Destiny API instance.
 * @param {Object} data Character information.
 * @private
 */
export default class Character {
  constructor(destiny, data) {
    var base = data.characterBase;

    this.destiny = destiny;
    this.id = base.id;
  }

  /**
   * Request the current inventory of the character.
   *
   * @param {Function} fn Completion callback.
   * @public
   */
  inventory(fn) {
    const { id, platform, character } = this.destiny
    return character.inventory(platform, id, this.id, fn);
  }
}
