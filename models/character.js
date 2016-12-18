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
    this.destiny = destiny;

    this.set(data);
  }

  /**
   * Update our internal specification to match the API response from Bungie.
   *
   * @param {Object} data Character information.
   * @public
   */
  set(data) {
    this.data = data;
    this.id = data.characterId;
    this.played = new Date(data.dateLastPlayed);
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
