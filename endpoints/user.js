/**
 * The API for interacting with the user account details.
 *
 * @constructor
 * @param {Destiny} destiny Reference to the destiny API.
 * @api private
 */
export default class User {
  constructor(destiny) {
    this.destiny = destiny;
  }

  /**
   * Fetch the user details.
   *
   * @param {Function} fn Completion callback
   * @returns {Destiny} Original API.
   * @api public
   */
  get(fn) {
    return this.destiny.send({
      url: ['User', 'GetBungieNetUser'],
      method: 'GET',
      bypass: true
    }, (err, data) => {
      if (err || !data) {
        return fn(err || new Error('Failed to lookup user, no details returned'));
      }

      //
      // Update our internal information to ensure that we're using the correct
      // user information for the given API key as the API key here is leading.
      //
      if (data.psnId) {
        this.destiny.change({
          username: data.psnId,
          platform: 'PlayStation'
        });
      } else if (data.gamerTag) {
        this.destiny.change({
          username: data.gamerTag,
          platform: 'Xbox'
        });
      }

      fn.call(this, undefined, data);
    });
  }

  /**
   * For the users's Bungie membership id.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} username Username we want to lookup.
   * @param {Function} fn Completion callback.
   * @api public
   */
  membership(platform, username, fn) {
    return this.destiny.send({
      url: ['Destiny', this.destiny.console(platform), 'Stats', 'GetMembershipIdByDisplayName', username],
      method: 'GET',
      bypass: true
    }, fn);
  }

  /**
   * Lookup account information to get the membership details.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Account id.
   * @param {Function} fn Completion callback.
   * @api public
   */
  account(platform, id, fn) {
    return this.destiny.send({
      url: ['Destiny', this.destiny.console(platform, true), 'Account', id],
      filter: 'data',
      method: 'GET',
      bypass: true
    }, fn);
  }
}
