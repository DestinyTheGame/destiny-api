/**
 * Polyfill for Bungie-Auth in our tests. It just implements the `token` method
 * that we use internally so we can generate an Authenication header.
 *
 * @private
 */
const bungieauth = {
  config: {
    key: 'api-key-for-bungie'
  },
  token(fn) {
    fn(undefined, {
      accessToken: {
        value: 'accesstoken-auth',
        readyin: 0,
        expires: 3600,
        epoch: Date.now()
      },
      refreshToken: {
        value: 'refreshtoken-auth',
        readyin: 1800,
        expires: 3600,
        epoch: Date.now()
      }
    });
  }
}

//
// Expose our API
//
export default bungieauth;
