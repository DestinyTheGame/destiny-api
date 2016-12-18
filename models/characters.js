import EventEmitter from 'eventemitter3';
import Character from './character';
import TickTock from 'tick-tock';

/**
 * Representation of your Bungie account.
 *
 * @constructor
 * @param {Destiny} destiny
 * @private
 */
export default class Account extends EventEmitter {
  constructor(destiny) {
    super();

    this.characters = [];
    this.destiny = destiny;
    this.timers = new TickTock();

    this.timers.setInterval('refresh', () => {
      this.refresh();
    }, 10000);
  }

  /**
   * Refresh our internal characters.
   *
   * @private
   */
  refresh() {
    const { user, platform, id } = this.destiny;

    //
    // The Destiny API has to be initialized in order for us to update all the
    // things. So if we don't have membership id or even know what platform we're
    // running on we should just ignore this update request.
    //
    if (!platform || !id) return;

    user.account(platform, id, (err, data) => {
      if (err) return this.emit('error', err);

      this.set(data);
    });
  }

  /**
   * Received an update of characters, start merging and updating all the
   * things.
   *
   * @param {Object} data API response from Bungie that contains account data.
   * @public
   */
  set(data) {
    data.characters.forEach((data) => {
      const base = data.characterBase;
      const character = this.find(base.characterId);

      //
      // A new character got created or this is the first time that we actually
      // created characters. So add them to our internal array.
      //
      if (!character) {
        return this.characters.push(new Character(this.destiny, base));
      }

      character.set(base);
    });
  }

  /**
   * Return the active character.
   *
   * @returns {Character}
   * @public
   */
  active() {

  }
}
