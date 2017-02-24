import diagnostics from 'diagnostics';

//
// Setup our debug utility.
//
const debug = diagnostics('destiny-api:api:characters');

/**
 * The API for interacting with the user account details.
 *
 * @constructor
 * @param {Destiny} destiny Reference to the destiny API.
 * @private
 */
export default class User {
  constructor(destiny) {
    this.api = destiny;
  }

  /**
   * Fetch the user details.
   *
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback
   * @returns {Destiny} API instance.
   * @public
   */
  get(options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'User/GetBungieNetUser/',
      callback: callback,
      options: options,
      template: {}
    });

    return this.api.send({
      url: url,
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
        this.api.change({
          username: data.user.displayName,
          platform: 'PlayStation'
        });
      } else if (data.gamerTag) {
        this.api.change({
          username: data.user.displayName,
          platform: 'Xbox'
        });
      }

      fn.call(this, undefined, data);
    });
  }

  /**
   * Fetch list of available avatars for user.
   *
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback.
   * @returns {Destiny} API instance.
   * @public
   */
  avatars(options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'User/GetAvailableAvatars/',
      callback: callback,
      options: options,
      template: {}
    });

    return this.api.send({
      url: url
    }, fn);
  }

  /**
   * Fetch list of available themes for user.
   *
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback.
   * @returns {Destiny} API instance.
   * @public
   */
  themes(options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'User/GetAvailableThemes/',
      callback: callback,
      options: options,
      template: {}
    });

    return this.api.send({
      url: url
    }, fn);
  }

  /**
   * Loads a bungie.net user by membership id.
   *
   * @param {String} membershipId membershipId of the users we're looking for.
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback.
   * @returns {Destiny} API instance.
   * @public
   */
  id(membershipId, options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'User/GetBungieNetUserById/{id}/',
      callback: callback,
      options: options,
      template: {
        id: membershipId
      }
    });

    return this.api.send({
      url: url
    }, fn);
  }

  /**
   * Loads a bungie.net user.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} username Username we want to lookup.
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback.
   * @returns {Destiny} API instance.
   * @public
   */
  search(platform, username, options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'Destiny/SearchDestinyPlayer/{membershipType}/{displayName}',
      callback: callback,
      options: options,
      template: {
        membershipType: this.api.console(platform),
        displayName: username
      }
    });

    return this.api.send({
      url: url
    }, fn);
  }

  /**
   * For the users's Bungie membership id.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} username Username we want to lookup.
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback.
   * @returns {Destiny} API instance.
   * @public
   */
  membership(platform, username, options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'Destiny/{membershipType}/Stats/GetMembershipIdByDisplayName/{displayName}/',
      callback: callback,
      options: options,
      template: {
        membershipType: this.api.console(platform),
        displayName: username
      }
    });

    return this.api.send({
      url: url,
      bypass: true,
    }, fn);
  }

  /**
   * Lookup account information to get the membership details.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Account id.
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback.
   * @returns {Destiny} API instance.
   * @public
   */
  account(platform, id, options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'Destiny/{membershipType}/Account/{destinyMembershipId}/Summary/',
      callback: callback,
      options: options,
      template: {
        membershipType: this.api.console(platform),
        destinyMembershipId: id
      }
    });

    return this.api.send({
      url: url,
      bypass: true,
      filter: 'data'
    }, fn);
  }

  /**
   * Lookup advisor information for the given account.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Account id.
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback.
   * @returns {Destiny} API instance.
   * @public
   */
  advisors(platform, id, options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'Destiny/{membershipType}/Account/{destinyMembershipId}/Advisors/',
      callback: callback,
      options: options,
      template: {
        destinyMembershipType: this.api.console(platform, true),
        destinyMembershipId: id
      }
    });

    return this.api.send({
      url: url
    }, fn);
  }
}
