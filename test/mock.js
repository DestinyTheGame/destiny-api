import route from 'nock-knock';
import nock from 'nock';
import path from 'path';

const destiny = nock('https://www.bungie.net/');
const validators = {
  membershipType: (value) => {
    return true;
  },

  displayName: (value) => {
    return true;
  },

  destinyId: (value) => {
    return true;
  }
};

//
// Mock up the Destiny API with a bunch of pre-defined responses.
//

destiny
.persist()
.get(route('/Platform/User/GetBungieNetUser/'))
.query(true)
.replyWithFile(200, path.join(__dirname, 'fixture', 'user.get.json'));

destiny
.persist()
.get(route('/Platform/Destiny/:membershipType/Stats/GetMembershipIdByDisplayName/:displayName/', validators))
.query(true)
.replyWithFile(200, path.join(__dirname, 'fixture', 'user.membership.json'));

destiny
.persist()
.get(route('/Platform/Destiny/:membershipType/Account/:destinyId/Summary/', validators))
.query(true)
.replyWithFile(200, path.join(__dirname, 'fixture', 'user.account.json'));

//
// Expose our mock server by default.
//
export default destiny;
