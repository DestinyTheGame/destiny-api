'use strict';

var EventEmitter = require('eventemitter3')
  , ms = require('millisecond')
  , async = require('async');

/**
 * The great vault of
 *
 * @constructor
 * @param {Destiny} destiny API instance we're manipulating.
 * @param {Number} ttl Time to life for vault queue.
 * @api public
 */
function Vault(destiny, ttl) {
  this.destiny = destiny;
  this.ttl = ms(ttl);
  this.refreshed = 0;
  this.items = [];
}

Vault.prototype = new EventEmitter();
Vault.prototype.constructor = Vault;

/**
 * Refresh the current set of available resources.
 *
 * @param {Function} fn Completion callback.
 * @returns {Vault}
 * @api public
 */
Vault.prototype.refresh = function refresh(fn) {
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
  async.series([], function loaded(err) {
    if (err) {}
  });

  this.emit('refreshed');
};

/**
 *
 * @param {String} what Item hash that needs to be stored.
 * @param {Number} many How many need to be stored.
 * @param {String} from Character id who initiates transfer.
 * @param {Function} fn Completion callback.
 * @returns {Vault}
 * @api public
 */
Vault.prototype.store = function store(what, many, from, fn) {
  return this.go(function () {
    fn();
  });
};

/**
 *
 * @param {Object} query Filter instructions.
 * @param {Function} fn Completion callback.
 * @api public
 */
Vault.prototype.filter = function filter(query, fn) {
  return this.go(function () {
    fn();
  });
};

/**
 * Execute the callback when we items in our vault.
 *
 * @param {Function} fn Completion callback.
 * @api public
 */
Vault.prototype.go = function go(fn) {
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
};

//
// Expose the instance.
//
module.exports = Vault;
