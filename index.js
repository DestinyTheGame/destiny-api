'use strict';

var EventEmitter = require('eventemitter3')
  , modification = require('modification')
  , pathval = require('pathval')
  , URL = require('url-parse')
  , cookie = require('cookie')
  , fail = require('failure')
  , async = require('async');

/**
 * Destiny API interactions.
 *
 * Options:
 *
 * - api:       Location of the API server that we're requesting.
 * - key:       Bungie API key.
 * - csrf:      Bungie CSRF key for authentication.
 * - platform:  Platform (console) that we're using.
 * - username:  Username of your account.
 * - timeout:   Maximum request timeout.
 * - cookie:    The Bungie.net cookies.
 * - ttl:       Time to live for the vault so items are continuously updated
 *              before interaction.
 *
 * @constructor
 * @param {Object} options Configuration.
 * @api public
 */
function Destiny(options) {
  if (!this) return new Destiny(options);

  this.key = '';
  this.api = 'https://www.bungie.net/Platform/';
  this.timeout = 30000;

  this.characters = []; // Available characters.
  this.platform = '';   // Console that is used.
  this.username = '';   // Bungie username.
  this.cookie = '';     // Bungie cookie string or parsed object.
  this.csrf = '';       // Bungie bungled value.
  this.id = '';         // Bungie membership id.

  this.change(options || {});

  //
  // These properties should be overridden by the supplied options object.
  //
  this.readystate = Destiny.CLOSED;
  this.vault = new Destiny.Vault(this, options.ttl || '5 minutes');
  this.XHR = options.XHR || global.XMLHttpRequest;
  this.initialize();
}

//
// Internal ready state..
//
Destiny.CLOSED    = 1;
Destiny.LOADING   = 2;
Destiny.COMPLETE  = 3;

Destiny.extend = require('extendible');
Destiny.prototype = new EventEmitter();
Destiny.prototype.constructor = Destiny;
Destiny.prototype.emits = require('emits');
Destiny.prototype.change = modification('changed');

/**
 * Initialize all the things.
 *
 * @api private
 */
Destiny.prototype.initialize = function initialize() {
  this.on('refresh', function reset(hard) {
    var props = {
      characters: [],
      platform: '',
      username: '',
      csrf: '',
      id: ''
    };

    if (hard) props.cookie = '';
    this.change(props);
  });

  //
  // If there is an error we want to completely nuke all information.
  //
  this.on('error', this.emits('refresh', true));
  this.refresh();
};

/**
 * Refresh all our chars and internal settings.
 *
 * @param {String} bungiecookie Refresh our characters.
 * @api private
 */
Destiny.prototype.refresh = function refresh(bungiecookie) {
  var destiny = this;

  destiny.change({ readystate: Destiny.LOADING }).emit('refresh');

  //
  // If a new cookie has been received we should parse it again.
  //
  if (bungiecookie) destiny.change({ cookie: bungiecookie });
  if ('string' === typeof destiny.cookie) {
    destiny.csrf = cookie.parse(destiny.cookie).bungled;
  }

  //
  // We need to pre-gather all the information from the Bungie API.
  //
  async.series([
    //
    // Phase 1: Get the platform and username from the API.
    //
    function get(next) {
      destiny.user.get(next);
    },

    //
    // Phase 2: Get the membership id for the username.
    //
    function search(next) {
      destiny.user.search(destiny.platform, destiny.username, function seach(err, data) {
        if (err) return next(err);

        destiny.change({
          readystate: Destiny.COMPLETE,
          id: data[0].membershipId
        });

        next();
      });
    },

    //
    // Phase 3: Get all characters for the given membership id.
    //
    function characters(next) {
      destiny.user.account(destiny.platform, destiny.id, function account(err, data) {
        if (err) return next(err);

        if (data.characters) destiny.change({
          characters: data.characters.map(function map(data) {
            return new Destiny.Character(destiny, data);
          })
        });

        next();
      });
    }
  ], function loaded(err) {
    if (err) return destiny.emit('error', fail(err, {
      reason: 'Failed to retrieve account information from the Bungie API',
      action: 'login'
    }));

    //
    // Flush all possible queued requests as we got all the information we
    // desire and require in order to make requests.
    //
    destiny.emit('refreshed');
  });

  return destiny;
};

/**
 * Send a request over the API.
 *
 * @param {Object} options The request options.
 * @param {Function} fn Completion callback.
 * @returns {Destiny}
 * @api public
 */
Destiny.prototype.send = function send(options, fn) {
  //
  // Check if we're allowed to make these http requests yet or if they require
  // login or additional account information.
  //
  if (!options.bypass && this.readystate !== Destiny.COMPLETE) {
    return this.once('refreshed', function refreshed(err) {
      if (err) return fn(err);

      //
      // Re-call the `send` method so we can process this outgoing HTTP request
      // as all information has been gathered from the required API endpoints.
      //
      send.call(this, options, fn);
    });
  }

  var xhr = new XMLHttpRequest()
    , destiny = this
    , using
    , url;

  //
  // Add some sane defaults to the request logic.
  //
  using = this.merge({
    method: 'GET'
  }, options || {});

  url =  using.url instanceof URL ? using.url : this.format(using.url);
  xhr.open(using.method, url.href, true);

  xhr.setRequestHeader('x-csrf', this.csrf);
  xhr.setRequestHeader('cookie', this.cookie);
  xhr.setRequestHeader('X-API-Key', this.key);
  xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');

  xhr.timeout = this.timeout;

  xhr.onload = function onload() {
    if (xhr.status !== 200) {
      return fn(fail(new Error('There seems to be problem with the Bungie API'), {
        code: xhr.status,
        action: 'retry',
        text: xhr.text,
        using: using,
        body: ''
      }));
    }

    var data = xhr.response || xhr.responseText;

    try { data = JSON.parse(data); }
    catch (e) {
      return fn(fail(new Error('Unable to parse the JSON response from the Bungie API'), {
        code: xhr.status,
        text: xhr.text,
        action: 'rety',
        using: using,
        body: data
      }));
    }

    //
    // Handle API based errors. It seems that error code 1 is usually returned
    // for valid requests while an ErrorCode of 0 was expected to be save we're
    // going to assume that 0 and 1 are both valid values.
    //
    if (data.ErrorCode > 1) {
      //
      // We've reached the throttle limit, so we should defer the request until
      // we're allowed to request again.
      //
      if (data.ErrorCode === 36) {
        return setTimeout(send.bind(destiny, options, fn), 1000 * data.ThrottleSeconds);
      }

      //
      // At this point we don't really know what kind of error we received so we
      // should fail hard and return a new error object.
      //
      return fn(fail(new Error(data.Message), data));
    }

    if (!using.filter) return fn(undefined, data.Response);

    fn(undefined, pathval.get(data.Response, using.filter));
  };

  xhr.send(using.body);
  return this;
};

/**
 * Merge the props of one object in to another.
 *
 * @param {Object} to Object where all props should be merged in to.
 * @param {Object} from Object who's props should be stolen from.
 * @returns {Object}
 * @api public
 */
Destiny.prototype.merge = function merge(to, from) {
  Object.keys(from).forEach(function each(prop) {
    if ('function' === typeof to[prop]) return;

    to[prop] = from[prop];
  });

  return to;
};

/**
 * Simple yet effective URL formatter.
 *
 * @param {String|Array} endpoint The API endpoint that we're trying to hit.
 * @param {Object} set An object with props that should be overridden in the URL
 * @returns {URL} Created URL instance.
 * @api public
 */
Destiny.prototype.format = function format(endpoint, set) {
  endpoint = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

  var url = new URL(
    (this.api + endpoint)
    .replace('{id}', this.id)
    .replace('{username}', this.username)
    .replace('{platform}', this.console())
  );

  if (set) Object.keys(set).forEach(function each(key) {
    url.set(key, set[key]);
  });

  return url;
};

/**
 * Transform the given platform in to the correct console type that is required
 * by the Bungie API.
 *
 * @param {Number|String} platform Console name.
 * @param {Boolean} apiname Return the API name instead.
 * @returns {Number}
 * @api public
 */
Destiny.prototype.console = function console(platform, apiname) {
  if (!platform) platform = this.platform;
  if ('number' !== typeof platform) {
    if (~platform.toString().toLowerCase().indexOf('xb')) platform = 1;
    else platform = 2;
  }

  if (!apiname) return platform;
  return 'Tiger'+ (platform === 1 ? 'Xbox' : 'PSN');
};

/**
 * Define an lazyload new API's.
 *
 * @param {String} name The name of the property
 * @param {Function} fn The function that returns the new value
 * @api private
 */
Destiny.define = function define(name, fn) {
  var where = this.prototype;

  Object.defineProperty(where, name, {
    configurable: true,
    get: function get() {
      return Object.defineProperty(this, name, {
        value: fn.call(this)
      })[name];
    },
    set: function set(value) {
      return Object.defineProperty(this, name, {
        value: value
      })[name];
    }
  });
};

//
// Add the lazy loaded API endpoint initialization.
//
[
  { name: 'user', Endpoint: require('./endpoints/user.js') },
  { name: 'character', Endpoint: require('./endpoints/character.js') }
].forEach(function each(spec) {
  Destiny.define(spec.name, function defined() {
    return new spec.Endpoint(this);
  });
});

/**
 * Expose our internal classes so they can be extended at will.
 *
 * @type {Function}
 * @public
 */
Destiny.Vault = require('./vault');
Destiny.Character = require('./character');

//
// Expose the API client.
//
module.exports = Destiny;
