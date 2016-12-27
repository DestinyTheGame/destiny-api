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
    this.destiny = destiny;
  }

  /**
   * Retrieve advisors for a given character.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Destiny id
   * @param {string} char Character id.
   * @param {Function} fn Completion callback.
   * @public
   */
  advisors(platform, id, char, fn) {
    return this.destiny.send({
      url: 'Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Advisors/V2/',
      filter: 'data',
      template: {
        membershipType: this.destiny.console(platform),
        destinyMembershipId: id,
        characterId: char
      }
    }, fn);
  }

  /**
   * Retrieve activities for a given character.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Destiny id
   * @param {string} char Character id.
   * @param {Function} fn Completion callback.
   * @public
   */
  activities(platform, id, char, fn) {
    return this.destiny.send({
      url: 'Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Activities/',
      filter: 'data',
      template: {
        membershipType: this.destiny.console(platform),
        destinyMembershipId: id,
        characterId: char
      }
    }, fn);
  }

  /**
   * Retrieve inventory for a given character.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Destiny id
   * @param {string} char Character id.
   * @param {Function} fn Completion callback.
   * @public
   */
  inventory(platform, id, char, fn) {
    return this.destiny.send({
      url: 'Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Inventory/Summary/',
      template: {
        membershipType: this.destiny.console(platform),
        destinyMembershipId: id,
        characterId: char
      }
    }, fn);
  }

  /**
   * Retrieve activity history for a given character.
   *
   * @param {String|Number} platform The platform type.
   * @param {String} id Destiny id
   * @param {string} char Character id.
   * @param {Function} fn Completion callback.
   * @public
   */
  history(platform, id, char, fn) {
    return this.destiny.send({
      url: 'Destiny/Stats/ActivityHistory/{membershipType}/{destinyMembershipId}/{characterId}/',
      template: {
        membershipType: this.destiny.console(platform),
        destinyMembershipId: id,
        characterId: char
      }
    }, fn);
  }
}
