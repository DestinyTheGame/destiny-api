import CharacterEndpoint from './endpoints/character';
import UserEndpoint from './endpoints/user';
import EventEmitter from 'eventemitter3';
import modification from 'modification';
import series from 'async/series';
import failure from 'failure';
import URL from 'url-parse';
import prop from 'propget';
import emits from 'emits';

/**
 * Destiny API interactions.
 *
 * Options:
 *
 * - api:       Location of the API server that we're requesting.
 * - key:       Bungie API key.
 * - platform:  Platform (console) that we're using.
 * - username:  Username of your account.
 * - timeout:   Maximum request timeout.
 * - ttl:       Time to live for the vault so items are continuously updated
 *              before interaction.
 *
 * @constructor
 * @param {Bungie} bungie The bungie-auth instance.
 * @param {Object} options Configuration.
 * @api public
 */
export default class Destiny extends EventEmitter {
  constructor(bungie, options = {}) {
    super();

    //
    // Spice up the EventEmitter API with some addition useful methods.
    //
    this.change = modification('changed');
    this.emits = emits;

    this.api = 'https://www.bungie.net/Platform/';

    this.timeout = 30000;   // API timeout.
    this.characters = [];   // Available characters.
    this.platform = '';     // Console that is used.
    this.username = '';     // Bungie username.
    this.id = '';           // Bungie membership id.

    this.change(options);

    //
    // These properties should NOT be overridden by the supplied options object.
    //
    this.bungie = bungie;
    this.readystate = Destiny.CLOSED;
    this.vault = new Destiny.Vault(this, options.ttl || '5 minutes');
    this.XHR = options.XHR || global.XMLHttpRequest;

    this.initialize();
  }

  /**
   * Initialize all the things.
   *
   * @api private
   */
  initialize() {
    this.on('refresh', function reset(hard) {
      var props = {
        characters: [],
        platform: '',
        username: '',
        id: ''
      };

      this.change(props);
    });

    //
    // If there is an error we want to completely nuke all information.
    //
    this.on('error', this.emits('refresh', true));
    this.refresh();
  }

  /**
   * Refresh all our chars and internal settings.
   *
   * @api private
   */
  refresh() {
    this.change({ readystate: Destiny.LOADING }).emit('refresh');

    //
    // We need to pre-gather all the information from the Bungie API.
    //
    series({
      //
      // Phase 1: Get the platform and username from the API.
      //
      user: (next) => {
        this.user.get(next);
      },

      //
      // Phase 2: Now that we've successfully received our user information
      // we're ready to process API calls so we set our readyState to complete.
      //
      readystate: (next) => {
        this.user.membership(this.platform, this.username, (err, data) => {
          if (err) return next(err);

          this.change({
            readystate: Destiny.COMPLETE,
            id: data
          });

          next();
        });
      },

      //
      // Phase 3: Get all characters for the given membership id.
      //
      account: (next) => {
        this.user.account(this.platform, this.id, (err, data) => {
          if (err) return next(err);

          if (data.characters) this.change({
            characters: data.characters.map((data) => {
              return new Destiny.Character(this, data);
            })
          });

          next();
        });
      }
    }, (err) => {
      if (err) return this.emit('error', failure(err, {
        reason: 'Failed to retrieve account information from the Bungie API',
        action: 'login'
      }));

      //
      // Flush all possible queued requests as we got all the information we
      // desire and require in order to make requests.
      //
      this.emit('refreshed');
    });

    return this;
  }

  /**
   * Send a request over the API.
   *
   * @param {Object} options The request options.
   * @param {Function} fn Completion callback.
   * @returns {Destiny}
   * @api public
   */
  send(options, fn) {
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

    const xhr = new this.XHR();
    const using = Object.assign({ method: 'GET' }, options || {});
    const url =  using.url instanceof URL ? using.url : this.format(using.url);

    xhr.open(using.method, url.href, true);
    xhr.timeout = this.timeout;

    xhr.onload = () => {
      if (xhr.status !== 200) {
        return fn(failure('There seems to be problem with the Bungie API', {
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
        return fn(failure('Unable to parse the JSON response from the Bungie API', {
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
          return setTimeout(send.bind(this, options, fn), 1000 * data.ThrottleSeconds);
        }

        //
        // At this point we don't really know what kind of error we received so we
        // should fail hard and return a new error object.
        //
        return fn(failure(data.Message, data));
      }

      //
      // Check if we need filter the data down using our filter property.
      //
      if (!using.filter) return fn(undefined, data.Response);

      fn(undefined, prop(data.Response, using.filter));
    };

    //
    // Retrieve the token from our bungie-auth instance so we can access the
    // secured API's
    //
    this.bungie.token((err, payload) => {
      if (err) return fn(err);

      xhr.setRequestHeader('X-API-Key', this.bungie.config.key);
      xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');
      xhr.setRequestHeader('Authorization', 'Bearer '+ payload.accessToken.value);

      xhr.send(using.body);
    });

    return this;
  }

  /**
   * Simple yet effective URL formatter.
   *
   * @param {String|Array} endpoint The API endpoint that we're trying to hit.
   * @param {Object} set An object with props that should be overridden in the URL
   * @returns {URL} Created URL instance.
   * @api public
   */
  format(endpoint, set) {
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

    //
    // Final check, we need to make sure that the pathname has a leading slash
    // so we don't have to follow potential redirects as all documented API
    // calls have the leading slash.
    //
    if (url.pathname.charAt(url.pathname.length - 1) !== '/') {
      url.set('pathname', url.pathname + '/');
    }

    return url;
  }

  /**
   * Transform the given platform in to the correct console type that is required
   * by the Bungie API.
   *
   * @param {Number|String} platform Console name.
   * @param {Boolean} apiname Return the API name instead.
   * @returns {Number}
   * @api public
   */
  console(platform, apiname) {
    if (!platform) platform = this.platform;
    if ('number' !== typeof platform) {
      if (~platform.toString().toLowerCase().indexOf('xb')) platform = 1;
      else platform = 2;
    }

    if (!apiname) return platform;
    return 'Tiger'+ (platform === 1 ? 'Xbox' : 'PSN');
  }
}

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
  { name: 'user', Endpoint: UserEndpoint },
  { name: 'character', Endpoint: CharacterEndpoint }
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
// Internal ready state..
//
Destiny.CLOSED    = 1;
Destiny.LOADING   = 2;
Destiny.COMPLETE  = 3;
