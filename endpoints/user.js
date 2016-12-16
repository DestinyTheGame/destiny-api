/**
 * The API for interacting with the user account details.
 *
 * @constructor
 * @param {Destiny} destiny Reference to the destiny API.
 * @private
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
   * @public
   */
  get(fn) {
    return this.destiny.send({ url: 'User/GetBungieNetUser/' }, (err, data) => {
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
   * Fetch list of available avatars for user.
   *
   * @param {Function} fn Completion callback.
   * @public
   */
  avatars() {
    return this.destiny.send({ url: 'User/GetAvailableAvatars/' }, fn);
  }

  /**
   * Fetch list of available themes for user.
   *
   * @param {Function} fn Completion callback.
   * @public
   */
  themes() {
    return this.destiny.send({ url: 'User/GetAvailableThemes/' }, fn);
  }

  /**
   * Loads a bungie.net user by membership id.
   *
   * @param {String} membershipId membershipId of the users we're looking for.
   * @param {Function} fn Completion callback.
   * @public
   */
  id(membershipId) {
    return this.destiny.send({
      url: 'User/GetBungieNetUserById/{id}/',
      format: {
        id: membershipId
      }
    }, fn);
  }

  /**
   * Loads a bungie.net user by membership id.
   *
   * @param {String} membershipId membershipId of the users we're looking for.
   * @param {Function} fn Completion callback.
   * @public
   */
  search(username, fn) {
    return this.destiny.send({
      url: 'User/SearchUsers/?q={search}'
      format: {
        search: username
      }
    }, fn);
  }

  /**
   * For the users's Bungie membership id.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} username Username we want to lookup.
   * @param {Function} fn Completion callback.
   * @public
   */
  membership(platform, username, fn) {
    return this.destiny.send({
      url: 'Destiny/{membershipType}/Stats/GetMembershipIdByDisplayName/{displayName}/',
      format: {
        membershipType: this.destiny.console(platform),
        displayName: username
      }
    }, fn);
  }

  /**
   * Lookup account information to get the membership details.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Account id.
   * @param {Function} fn Completion callback.
   * @public
   */
  account(platform, id, fn) {
    return this.destiny.send({
      url: 'Destiny/{membershipType}/Account/{destinyMembershipId}/Summary/',
      format: {
        membershipType: this.destiny.console(platform),
        destinyMembershipId: id
      }
    }, fn);
  }

  /**
   * Lookup advisor information for the given account.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Account id.
   * @param {Function} fn Completion callback.
   * @public
   */
  advisors(platform, id, fn) {
    return this.destiny.send({
      url: 'Destiny/{membershipType}/Account/{destinyMembershipId}/Advisors/'
      format: {
        destinyMembershipType: this.destiny.console(platform, true),
        destinyMembershipId: id
      }
    }, fn);
  }
}
