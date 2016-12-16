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

    this.data = base;
    this.destiny = destiny;

    this.id = base.characterId;
    this.played = new Date(base.dateLastPlayed);
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

  /**
   * Retrieve player activities.
   *
   * @param {Function} fn Completion callback.
   * @public
   */
  activities(fn) {
    const { id, platform, character } = this.destiny
    return character.activities(platform, id, this.id, fn);
  }

  /**
   * Retrieve player advisors.
   *
   * @param {Function} fn Completion callback.
   * @public
   */
  advisors(fn) {
    const { id, platform, character } = this.destiny
    return character.advisors(platform, id, this.id, fn);
  }
}
