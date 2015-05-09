describe('destiny', function () {
  'use strict';

  var cookie = process.env.COOKIE
    , assume = require('assume')
    , Destiny = require('./')
    , destiny;

  //
  // We're at the mercy of the API. Don't do anything silly.
  //
  this.timeout(10000);

  before(function (next) {
    destiny = new Destiny({
      XHR: require('xmlhttprequest').XMLHttpRequest,
      cookie: cookie
    });

    destiny.once('refreshed', next);
  });

  it('is exported as a function', function () {
    assume(Destiny).is.a('function');
  });

  describe('initialization', function () {
    it('pre-fetches all required details', function () {
      assume(destiny.username).equals('i3rdEden');
      assume(destiny.platform).equals('PlayStation');
      assume(destiny.id).is.a('string');
      assume(destiny.id).does.not.equals('');
    });

    it('sets the readystate to COMPLETE', function () {
      assume(destiny.readystate).equals(Destiny.COMPLETE);
    });

    it('emits change events for id changes', function (next) {
      var d = new Destiny({
        cookie: cookie
      });

      d.once('usernamechanged', function (to, from) {
        assume(to).equals('i3rdEden');
        assume(from).equals('');

        d.once('readystatechanged', function (to, from) {
          assume(to).equals(Destiny.COMPLETE);
          assume(from).equals(Destiny.LOADING);

          next();
        });
      });
    });
  });

  describe('.user', function () {
    describe('.get', function () {
      it('gets the username and platform', function (next) {
        destiny.user.get(function (err, data) {
          if (err) return next(err);

          assume(data.psnId).equals('i3rdEden');
          next();
        });
      });

      it('automatically sets the username & platform', function (next) {
        destiny.change({ username: '', platform: '' });

        assume(destiny.username).equals('');
        assume(destiny.platform).equals('');

        destiny.user.get(function (err, data) {
          if (err) return next(err);

          assume(destiny.username).equals('i3rdEden');
          assume(destiny.platform).equals('PlayStation');

          next();
        });
      });
    });

    describe('.search', function () {
      it('searches for all membership ids', function (next) {
        destiny.user.search(destiny.platform, destiny.username, function (err, data) {
          if (err) return next(err);

          assume(data).is.a('array');
          assume(data[0].displayName).equals(destiny.username);

          next();
        });
      });
    });

    describe('.account', function () {
      it('returns data', function (next) {
        destiny.user.account(destiny.platform, destiny.id, function (err, data) {
          if (err) return next(err);

          assume(data.membershipId).equals(destiny.id);
          assume(data.characters).is.a('array');

          next();
        });
      });
    });
  });
});
