import diagnostics from 'diagnostics';

//
// Setup our debug utility.
//
const debug = diagnostics('destiny-api:api:characters');

/**
 * API endpoint to manipulate and interact with your destiny character.
 *
 * @constructor
 * @param {Destiny} destiny Reference to the destiny API.
 * @private
 */
export default class Character {
  constructor(destiny) {
    this.api = destiny;
  }

  /**
   * Retrieve advisors for a given character.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Destiny id
   * @param {string} char Character id.
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback.
   * @returns {Destiny} API instance.
   * @public
   */
  advisors(platform, id, char, options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Advisors/V2/',
      callback: callback,
      options: options,
      template: {
        membershipType: this.api.console(platform),
        destinyMembershipId: id,
        characterId: char
      }
    });

    return this.api.send({
      url: url,
      filter: 'data'
    }, fn);
  }

  /**
   * Retrieve activities for a given character.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Destiny id
   * @param {string} char Character id.
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback.
   * @returns {Destiny} API instance.
   * @public
   */
  activities(platform, id, char, options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Activities/',
      callback: callback,
      options: options,
      template: {
        membershipType: this.api.console(platform),
        destinyMembershipId: id,
        characterId: char
      }
    });

    return this.api.send({
      url: url,
      filter: 'data',
    }, fn);
  }

  /**
   * Retrieve inventory for a given character.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Destiny id
   * @param {string} char Character id.
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback.
   * @returns {Destiny} API instance.
   * @public
   */
  inventory(platform, id, char, options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Inventory/',
      callback: callback,
      options: options,
      template: {
        membershipType: this.api.console(platform),
        destinyMembershipId: id,
        characterId: char
      }
    });

    return this.api.send({
      url: url
    }, fn);
  }

  /**
   * Retrieve activity history for a given character.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Destiny id
   * @param {string} char Character id.
   * @param {Object} options Optional configuration.
   * @param {Function} callback Completion callback.
   * @returns {Destiny} API instance.
   * @public
   */
  history(platform, id, char, options, callback) {
    const { url, fn } = this.api.args({
      endpoint: 'Destiny/Stats/ActivityHistory/{membershipType}/{destinyMembershipId}/{characterId}/',
      callback: callback,
      options: options,
      template: {
        membershipType: this.api.console(platform),
        destinyMembershipId: id,
        characterId: char
      }
    });

    return this.api.send({
      url: url
    }, fn);
  }
}
