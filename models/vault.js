import EventEmitter from 'eventemitter3';
import diagnostics from 'diagnostics';
import series from 'async/series';
import ms from 'millisecond';

//
// Setup our debug utility.
//
const debug = diagnostics('destiny-api:model:vault');

/**
 * The great vault of
 *
 * @constructor
 * @param {Destiny} destiny API instance we're manipulating.
 * @param {Number} ttl Time to life for vault queue.
 * @api public
 */
export default class Vault extends EventEmitter {
  constructor(destiny, ttl) {
    super();

    this.destiny = destiny;
    this.ttl = ms(ttl);
    this.refreshed = 0;
    this.items = [];
  }

  /**
   * Refresh the current set of available resources.
   *
   * @param {Function} fn Completion callback.
   * @returns {Vault}
   * @api public
   */
  refresh(fn) {
    var vault = this
      , destiny = this.destiny;

    //
    // Sorry! Out of items. We deleted everything from your vault. JK. This is
    // just JavaScript, you silly.
    //
    vault.items.length = 0;

    //
    // Do a bunch of API calls.
    //
    // 1. get inventory for all chars
    // 2. get vault
    // 3. create new Item instances.
    // 4. emit `refreshed` event to un-queue the `go` requests.
    //
    series([], function loaded(err) {
      if (err) {}
    });

    this.emit('refreshed');
  }

  /**
   *
   * @param {String} what Item hash that needs to be stored.
   * @param {Number} many How many need to be stored.
   * @param {String} from Character id who initiates transfer.
   * @param {Function} fn Completion callback.
   * @returns {Vault}
   * @api public
   */
  store(what, many, from, fn) {
    return this.go(function () {
      fn();
    });
  }

  /**
   * Filter things in the vault.
   *
   * @param {Object} query Filter instructions.
   * @param {Function} fn Completion callback.
   * @api public
   */
  filter(query, fn) {
    return this.go(function () {
      fn();
    });
  }

  /**
   * Execute the callback when we items in our vault.
   *
   * @param {Function} fn Completion callback.
   * @api public
   */
  go(fn) {
    if (
         !this.refreshed
      || Date.now() - this.refreshed > this.ttl
    ) {
      this.once('refreshed', fn);
      this.refresh();
    } else {
      fn.call(this);
    }

    return this;
  }
}
