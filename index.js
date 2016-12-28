import EventEmitter from 'eventemitter3';
import modification from 'modification';
import diagnostics from 'diagnostics';
import series from 'async/series';
import failure from 'failure';
import Queue from 'queueback';
import URL from 'url-parse';
import prop from 'propget';
import emits from 'emits';

//
// Import our actual API endpoints.
//
import CharacterEndpoint from './endpoints/character';
import UserEndpoint from './endpoints/user';

//
// Import various of models.
//
import { Characters } from './models';

//
// Setup our debug utility.
//
const debug = diagnostics('destiny-api');

/**
 * Destiny API interactions.
 *
 * Options:
 *
 * - api:       Location of the API server that we're requesting.
 * - platform:  Platform (console) that we're using.
 * - username:  Username of your account.
 * - timeout:   Maximum request timeout.
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

    this.timeout = 30000;                     // API timeout.
    this.platform = '';                       // Console that is used.
    this.username = '';                       // Bungie username.
    this.id = '';                             // Bungie membership id.

    this.change(options);

    //
    // These properties should NOT be overridden by the supplied options object.
    //
    this.bungie = bungie;
    this.queue = new Queue();
    this.readystate = Destiny.CLOSED;
    this.characters = new Characters(this);
    this.XHR = options.XHR || global.XMLHttpRequest;

    this.initialize();
  }

  /**
   * Initialize all the things.
   *
   * @api private
   */
  initialize() {
    debug('initializing API');

    this.on('refresh', function reset(hard) {
      this.change({
        characters: new Characters(this),
        platform: '',
        username: '',
        id: ''
      });
    });

    //
    // If there is an error we want to completely nuke all information.
    //
    this.on('error', this.emits('refresh', true));
    this.on('error', debug);

    this.refresh();
  }

  /**
   * Refresh all our chars and internal settings.
   *
   * @api private
   */
  refresh() {
    debug('refreshing our internals');
    this.change({ readystate: Destiny.LOADING }).emit('refresh');

    //
    // We need to pre-gather all the information from the Bungie API.
    //
    series({
      //
      // Phase 1: Get the platform and username from the API.
      //
      user: (next) => {
        debug('fetching user information');
        this.user.get(next);
      },

      //
      // Phase 2: Now that we've successfully received our user information
      // we're ready to process API calls so we set our readyState to complete.
      //
      readystate: (next) => {
        debug('searching for membership id');

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
        debug('retrieving all chars for the membership id');

        this.user.account(this.platform, this.id, (err, data) => {
          if (err) return next(err);

          this.characters.set(data);
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
   * Execute the function when the instance is loaded.
   *
   * @param {Function} fn
   * @returns {Destiny}
   * @public
   */
  go(fn) {
    if (this.readystate !== Destiny.COMPLETE) {
      return this.once('refreshed', fn);
    }

    fn();
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
      debug('queue api call for %s, readyState is not yet complete', options.url);

      return this.once('refreshed', function refreshed(err) {
        if (err) return fn(err);

        //
        // Re-call the `send` method so we can process this outgoing HTTP request
        // as all information has been gathered from the required API endpoints.
        //
        this.send(options, fn);
      });
    }

    //
    // Setup the XHR request with the correct formatted URL.
    //
    const template = options.template || {};
    const using = Object.assign({ method: 'GET' }, options || {});
    const url =  this.format(using.url, Object.assign({
      displayName: template.displayName || this.username,
      destinyMembershipId: template.destinyMembershipId || this.id,
      membershipType: template.membershipType || this.console()
    }, template));

    //
    // Small but really important optimization: For GET requests the last thing
    // we want to do is to make API calls that we've just send and are being
    // processed as we speak. We have no idea where the consumer is making API
    // calls from so it can be that they are asking for the same data from
    // multiple locations in their code. We want to group these API requests.
    //
    const method = using.method;
    const href = url.href;

    if (this.queue.add(method, href, fn)) return;

    const xhr = new this.XHR();

    xhr.open(method, href, true);
    xhr.timeout = this.timeout;

    xhr.onload = () => {
      if (xhr.status !== 200) {
        return this.queue.run(method, href, failure('There seems to be problem with the Bungie API', {
          code: xhr.status,
          action: 'retry',
          text: xhr.text,
          using: using,
          body: ''
        }));
      }

      let data = xhr.response || xhr.responseText;

      try { data = JSON.parse(data); }
      catch (e) {
        return this.queue.run(method, href, failure('Unable to parse the JSON response from the Bungie API', {
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
        debug('we received an error code (%s) from the bungie api for %s', data.ErrorCode, url.href);
        //
        // We've reached the throttle limit, so we should defer the request until
        // we're allowed to request again.
        //
        if (data.ErrorCode === 36) {
          this.queue.remove(method, href, fn);
          debug('reached throttle limit, rescheduling API call');
          return setTimeout(send.bind(this, options, fn), 1000 * data.ThrottleSeconds);
        }

        //
        // At this point we don't really know what kind of error we received so we
        // should fail hard and return a new error object.
        //
        debug('received an error from the api: %s', data.Message);
        return this.queue.run(method, url, failure(data.Message, data));
      }

      //
      // Check if we need filter the data down using our filter property.
      //
      if (!using.filter) return this.queue.run(method, url, undefined, data.Response);

      this.queue.run(method, url, undefined, prop(data.Response, using.filter));
    };

    //
    // Retrieve the token from our bungie-auth instance so we can access the
    // secured API's
    //
    this.bungie.token((err, payload) => {
      if (err) {
        debug('failed to retreive an accessToken: %s', err.message);
        return this.queue.run(method, url, err);
      }

      xhr.setRequestHeader('X-API-Key', this.bungie.config.key);
      xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');
      xhr.setRequestHeader('Authorization', 'Bearer '+ payload.accessToken.value);

      debug('send API request to %s', url.href);
      xhr.send(using.body);
    });

    return this;
  }

  /**
   * Simple yet effective URL formatter.
   *
   * @param {String|Array} endpoint The API endpoint that we're trying to hit.
   * @param {Object} data Additional data that needs to be transformed.
   * @returns {URL} Created URL instance.
   * @api public
   */
  format(endpoint, data) {
    endpoint = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

    //
    // Replace our template or "place holders" with our supplied data.
    //
    let api = this.api + endpoint;

    for(let prop in data) {
      api = api.replace(new RegExp('{'+ prop +'}','g'), data[prop]);
    }

    const url = new URL(api);

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
 * Define an lazy load new API's.
 *
 * @param {String} name The name of the property
 * @param {Function} fn The function that returns the new value
 * @api private
 */
Destiny.define = function define(name, fn) {
  const where = this.prototype;

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

//
// Internal ready state..
//
Destiny.CLOSED    = 1;
Destiny.LOADING   = 2;
Destiny.COMPLETE  = 3;
