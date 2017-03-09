import EventEmitter from 'eventemitter3';
import diagnostics from 'diagnostics';
import Character from './character';
import TickTock from 'tick-tock';

//
// Setup our debug utility.
//
const debug = diagnostics('destiny-api:model:characters');

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

    this.on('error', debug);
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

    debug('about to refresh internal characters');
    user.account(platform, id, (err, data) => {
      if (err) return this.emit('error', err);

      debug('received refresh, updating internal characters');
      this.set(data);
    });
  }

  /**
   * Check the character at the specified index;
   *
   * @param {Number} index Index of the character.
   * @returns {Character} Character model.
   * @public
   */
  get(index) {
    return this.characters[0];
  }

  /**
   * Find a character by a given character id.
   *
   * @param {String} id Character id.
   * @returns {Character} Character model.
   * @public
   */
  find(id) {
    return this.characters.find((character) => character.id === id);
  }

  /**
   * Iterate over the characters.
   *
   * @returns {Array} characters
   * @public
   */
  forEach() {
    return this.characters.forEach(...arguments);
  }

  /**
   * Received an update of characters, start merging and updating all the
   * things.
   *
   * @param {Object} data API response from Bungie that contains account data.
   * @public
   */
  set(data) {
    if ('object' !== typeof data || !Array.isArray(data.characters)) {
      return debug('received invalid data structure, not updating chars');
    }

    data.characters.forEach((data) => {
      const base = data.characterBase;
      const id = base.characterId;
      const character = this.find(id);

      //
      // A new character got created or this is the first time that we actually
      // created characters. So add them to our internal array.
      //
      if (!character) {
        debug('no previous character found for id %s, creating a new', id);
        return this.characters.push(new Character(this.destiny, base));
      }

      debug('found a previous character %s updating its data', id);
      character.set(base);
    });

    //
    // Make sure that we correctly sort the chars on activity.
    //
    this.characters.sort(function sort(a, b) {
      return +a.played < +b.played;
    });

    this.emit('update', data);
  }

  /**
   * Return the active character.
   *
   * @returns {Character}
   * @public
   */
  active() {
    return this.get(0);
  }

  /**
   * Destroy the class instance.
   *
   * @public
   */
  destroy() {
    this.timers.destroy();
    this.characters.length = 0;
  }
}
