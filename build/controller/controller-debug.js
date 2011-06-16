YUI.add('controller', function(Y) {

/**
The app framework provides simple MVC-like building blocks (models, model lists,
views, and controllers) for writing single-page JavaScript applications.

@main app
@module app
**/

/**
Provides URL-based routing using HTML5 `pushState()` or the location hash.

This makes it easy to wire up route handlers for different application states
while providing full back/forward navigation support and bookmarkable, shareable
URLs.

@submodule controller
@class Controller
@constructor
@uses Base
**/

var HistoryHash = Y.HistoryHash,
    Lang        = Y.Lang,
    QS          = Y.QueryString,
    YArray      = Y.Array,

    // Android versions lower than 3.0 are buggy and don't update
    // window.location after a pushState() call, so we fall back to hash-based
    // history for them.
    //
    // See http://code.google.com/p/android/issues/detail?id=17471
    html5    = Y.HistoryBase.html5 && (!Y.UA.android || Y.UA.android >= 3),
    win      = Y.config.win,
    location = win.location,

    /**
    Fired when the controller is ready to begin dispatching to route handlers.

    You shouldn't need to wait for this event unless you plan to implement some
    kind of custom dispatching logic. It's used internally in order to avoid
    dispatching to an initial route if a browser history change occurs first.

    @event ready
    @param {Boolean} dispatched `true` if routes have already been dispatched
      (most likely due to a history change).
    @fireOnce
    **/
    EVT_READY = 'ready';

function Controller() {
    Controller.superclass.constructor.apply(this, arguments);
}

Y.Controller = Y.extend(Controller, Y.Base, {
    // -- Public Properties ----------------------------------------------------

    /**
    If `true`, the controller will dispatch to the first route handler that
    matches the current URL immediately after the controller is initialized,
    even if there was no browser history change to trigger a dispatch.

    If you're rendering the initial pageview on the server, then you'll probably
    want this to be `false`, but if you're doing all your rendering and route
    handling entirely on the client, then setting this to `true` will allow your
    client-side routes to handle the initial request of all pageviews without
    depending on any server-side handling.

    This property defaults to `false` for HTML5 browsers, `true` for browsers
    that rely on hash-based history (since the hash is never sent to the
    server).

    @property dispatchOnInit
    @type Boolean
    @default `false` for HTML5 browsers, `true` for hash-based browsers
    **/
    dispatchOnInit: !html5,

    /**
    Root path from which all routes should be evaluated.

    For example, if your controller is running on a page at
    `http://example.com/myapp/` and you add a route with the path `/`, your
    route will never execute, because the path will always be preceded by
    `/myapp`. Setting `root` to `/myapp` would cause all routes to be evaluated
    relative to that root URL, so the `/` route would then execute when the
    user browses to `http://example.com/myapp/`.

    This property may be overridden in a subclass, set after instantiation, or
    passed as a config attribute when instantiating a `Y.Controller`-based
    class.

    @property root
    @type String
    @default `''`
    **/
    root: '',

    /**
    Array of route objects specifying routes to be created at instantiation
    time.

    Each item in the array must be an object with the following properties:

      * `path`: String or regex representing the path to match. See the docs for
        the `route()` method for more details.
      * `callback`: Function or a string representing the name of a function on
        this controller instance that should be called when the route is
        triggered. See the docs for the `route()` method for more details.

    This property may be overridden in a subclass or passed as a config
    attribute when instantiating a `Y.Controller`-based class, but setting it
    after instantiation will have no effect (use the `route()` method instead).

    If routes are passed at instantiation time, they will override any routes
    set on the prototype.

    @property routes
    @type Object[]
    @default `[]`
    **/
    routes: [],

    // -- Protected Properties -------------------------------------------------

    /**
    Whether or not `_dispatch()` has been called since this controller was
    instantiated.

    @property _dispatched
    @type Boolean
    @default undefined
    @protected
    **/

    /**
    Whether or not this browser is capable of using HTML5 history.

    @property _html5
    @type Boolean
    @protected
    **/
    _html5: html5,

    /**
    Whether or not the `ready` event has fired yet.

    @property _ready
    @type Boolean
    @default undefined
    @protected
    **/

    /**
    Regex used to match parameter placeholders in route paths.

    Subpattern captures:

      1. Parameter prefix character. Either a `:` for subpath parameters that
         should only match a single level of a path, or `*` for splat parameters
         that should match any number of path levels.
      2. Parameter name.

    @property _regexPathParam
    @type RegExp
    @protected
    **/
    _regexPathParam: /([:*])([\w\d-]+)/g,

    /**
    Regex that matches and captures the query portion of a URL, minus the
    preceding `?` character, and discarding the hash portion of the URL if any.

    @property _regexUrlQuery
    @type RegExp
    @protected
    **/
    _regexUrlQuery: /\?([^#]*).*$/,

    // -- Lifecycle Methods ----------------------------------------------------
    initializer: function (config) {
        var self = this;

        // Set config properties.
        config || (config = {});

        config.routes && (self.routes = config.routes);

        Lang.isValue(config.root) && (self.root = config.root);
        Lang.isValue(config.dispatchOnInit) &&
                (self.dispatchOnInit = config.dispatchOnInit);

        // Create routes.
        self._routes = [];

        YArray.each(self.routes, function (route) {
            self.route(route.path, route.callback, true);
        });

        // Set up a history instance or hashchange listener.
        if (html5) {
            self._history = new Y.HistoryHTML5({force: true});
            self._history.after('change', self._afterHistoryChange, self);
        } else {
            Y.on('hashchange', self._afterHistoryChange, win, self);
        }

        // Fire a 'ready' event once we're ready to route. We wait first for all
        // subclass initializers to finish, and then an additional 20ms to allow
        // the browser to fire an initial `popstate` event if it wants to.
        self.publish(EVT_READY, {
            defaultFn  : self._defReadyFn,
            fireOnce   : true,
            preventable: false
        });

        self.once('initializedChange', function () {
            setTimeout(function () {
                self.fire(EVT_READY, {dispatched: !!self._dispatched});
            }, 20);
        });
    },

    destructor: function () {
        if (html5) {
            this._history.detachAll();
        } else {
            Y.detach('hashchange', this._afterHistoryChange, win);
        }
    },

    // -- Public Methods -------------------------------------------------------

    /**
    Returns an array of route objects that match the specified URL path.

    This method is called internally to determine which routes match the current
    path whenever the URL changes. You may override it if you want to customize
    the route matching logic, although this usually shouldn't be necessary.

    Each returned route object has the following properties:

      * `callback`: A function or a string representing the name of a function
        this controller that should be executed when the route is triggered.
      * `keys`: An array of strings representing the named parameters defined in
        the route's path specification, if any.
      * `path`: The route's path specification, which may be either a string or
        a regex.
      * `regex`: A regular expression version of the route's path specification.
        This regex is used to determine whether the route matches a given path.

    @example
        controller.route('/foo', function () {});
        controller.match('/foo');
        // => [{callback: ..., keys: [], path: '/foo', regex: ...}]

    @method match
    @param {String} path URL path to match.
    @return {Object[]} Array of route objects that match the specified path.
    **/
    match: function (path) {
        return YArray.filter(this._routes, function (route) {
            return path.search(route.regex) > -1;
        });
    },

    /**
    Replaces the current browser history entry with a new one, and dispatches to
    the first matching route handler, if any.

    Behind the scenes, this method uses HTML5 `pushState()` in browsers that
    support it (or the location hash in older browsers and IE) to change the
    URL.

    The specified URL must share the same origin (i.e., protocol, host, and
    port) as the current page, or an error will occur.

    @example
        // Starting URL: http://example.com/

        controller.replace('/path/');
        // New URL: http://example.com/path/

        controller.replace('/path?foo=bar');
        // New URL: http://example.com/path?foo=bar

        controller.replace('/');
        // New URL: http://example.com/

    @method replace
    @param {String} [url] URL to set. Should be a relative URL. If this
      controller's `root` property is set, this URL must be relative to the
      root URL. If no URL is specified, the page's current URL will be used.
    @chainable
    @see save()
    **/
    replace: function (url) {
        return this._save(url, true);
    },

    /**
    Adds a route handler for the specified URL _path_.

    The _path_ parameter may be either a string or a regular expression. If it's
    a string, it may contain named parameters: `:param` will match any single
    part of a URL path (not including `/` characters), and `*param` will match
    any number of parts of a URL path (including `/` characters). These named
    parameters will be made available as keys on the `req.params` object that's
    passed to route handlers.

    If the _path_ parameter is a regex, all pattern matches will be made
    available as numbered keys on `req.params`, starting with `0` for the full
    match, then `1` for the first subpattern match, and so on.

    Here's a set of sample routes along with URL paths that they match:

      * Route: `/photos/:tag/:page`
        * URL: `/photos/kittens/1`, params: `{tag: 'kittens', 'page': '1'}`
        * URL: `/photos/puppies/2`, params: `{tag: 'puppies', 'page': '2'}`

      * Route: `/file/*path`
        * URL: `/file/foo/bar/baz.txt`, params: `{path: 'foo/bar/baz.txt'}`
        * URL: `/file/foo`, params: `{path: 'foo'}`

    If multiple route handlers match a given URL, they will be executed in the
    order they were added. The first route that was added will be the first to
    be executed.

    @example
        controller.route('/photos/:tag/:page', function (req, next) {
          Y.log('Current tag: ' + req.params.tag);
          Y.log('Current page number: ' + req.params.page);
        });

    @method route
    @param {String|RegExp} path Path to match. May be a string or a regular
      expression.
    @param {Function|String} callback Callback function to call whenever this
        route is triggered. If specified as a string, the named function will be
        called on this controller instance.
      @param {Object} callback.req Request object containing information about
          the request. It contains the following properties.
        @param {Object} callback.req.params Captured parameters matched by the
          route path specification. If a string path was used and contained
          named parameters, then this will be a key/value hash mapping parameter
          names to their matched values. If a regex path was used, the keys will
          be numbered subpattern matches starting at `'0'` for the full match,
          then `'1'` for the first subpattern match, and so on.
        @param {String} callback.req.path The current URL path.
        @param {Object} callback.req.query Query hash representing the URL query
          string, if any. Parameter names are keys, and are mapped to parameter
          values.
      @param {Function} callback.next Callback to pass control to the next
        matching route. If you don't call this function, then no further route
        handlers will be executed, even if there are more that match. If you do
        call this function, then the next matching route handler (if any) will
        be called, and will receive the same `req` object that was passed to
        this route (so you can use the request object to pass data along to
        subsequent routes).
    @chainable
    **/
    route: function (path, callback) {
        var keys = [];

        this._routes.push({
            callback: callback,
            keys    : keys,
            path    : path,
            regex   : this._getRegex(path, keys)
        });

        return this;
    },

    /**
    Saves a new browser history entry and dispatches to the first matching route
    handler, if any.

    Behind the scenes, this method uses HTML5 `pushState()` in browsers that
    support it (or the location hash in older browsers and IE) to change the
    URL and create a history entry.

    The specified URL must share the same origin (i.e., protocol, host, and
    port) as the current page, or an error will occur.

    @example
        // Starting URL: http://example.com/

        controller.save('/path/');
        // New URL: http://example.com/path/

        controller.save('/path?foo=bar');
        // New URL: http://example.com/path?foo=bar

        controller.save('/');
        // New URL: http://example.com/

    @method save
    @param {String} [url] URL to set. Should be a relative URL. If this
      controller's `root` property is set, this URL must be relative to the
      root URL. If no URL is specified, the page's current URL will be used.
    @chainable
    @see replace()
    **/
    save: function (url) {
        return this._save(url);
    },

    // -- Protected Methods ----------------------------------------------------

    /**
    Wrapper around `decodeURIComponent` that also converts `+` chars into
    spaces.

    @method _decode
    @param {String} string String to decode.
    @return {String} Decoded string.
    @protected
    **/
    _decode: function (string) {
        return decodeURIComponent(string.replace(/\+/g, ' '));
    },

    /**
    Dispatches to the first route handler that matches the specified _path_.

    If called before the `ready` event has fired, the dispatch will be aborted.
    This ensures normalized behavior between Chrome (which fires a `popstate`
    event on every pageview) and other browsers (which do not).

    @method _dispatch
    @param {String} path URL path.
    @protected
    **/
    _dispatch: function (path) {
        var self   = this,
            routes = self.match(path),
            req;

        self._dispatched = true;

        if (!routes || !routes.length) {
            return;
        }

        req = self._getRequest(path);

        function next(err) {
            var callback, matches, route;

            if (err) {
                Y.error(err);
            } else if ((route = routes.shift())) {
                matches  = route.regex.exec(path);
                callback = typeof route.callback === 'string' ?
                        self[route.callback] : route.callback;

                // Use named keys for parameter names if the route path contains
                // named keys. Otherwise, use numerical match indices.
                if (matches.length === route.keys.length + 1) {
                    req.params = YArray.hash(route.keys, matches.slice(1));
                } else {
                    req.params = {};

                    YArray.each(matches, function (value, i) {
                        req.params[i] = value;
                    });
                }

                callback.call(self, req, next);
            }
        }

        next();
    },

    /**
    Gets the current path from the location hash, or an empty string if the
    hash is empty.

    @method _getHashPath
    @return {String} Current hash path, or an empty string if the hash is empty.
    @protected
    **/
    _getHashPath: function () {
        return HistoryHash.getHash().replace(this._regexUrlQuery, '');
    },

    /**
    Gets the current route path.

    @method _getPath
    @return {String} Current route path.
    @protected
    **/
    _getPath: html5 ? function () {
        return this._removeRoot(location.pathname);
    } : function () {
        return this._getHashPath() || this._removeRoot(location.pathname);
    },

    /**
    Gets the current route query string.

    @method _getQuery
    @return {String} Current route query string.
    @protected
    **/
    _getQuery: html5 ? function () {
        return location.search.substring(1);
    } : function () {
        var hash    = HistoryHash.getHash(),
            matches = hash.match(this._regexUrlQuery);

        return hash && matches ? matches[1] : location.search.substring(1);
    },

    /**
    Creates a regular expression from the given route specification. If _path_
    is already a regex, it will be returned unmodified.

    @method _getRegex
    @param {String|RegExp} path Route path specification.
    @param {Array} keys Array reference to which route parameter names will be
      added.
    @return {RegExp} Route regex.
    @protected
    **/
    _getRegex: function (path, keys) {
        if (path instanceof RegExp) {
            return path;
        }

        path = path.replace(this._regexPathParam, function (match, operator, key) {
            keys.push(key);
            return operator === '*' ? '(.*?)' : '([^/]*)';
        });

        return new RegExp('^' + path + '$');
    },

    /**
    Gets a request object that can be passed to a route handler.

    @method _getRequest
    @param {String} path Current path being dispatched.
    @return {Object} Request object.
    @protected
    **/
    _getRequest: function (path) {
        return {
            path : path,
            query: this._parseQuery(this._getQuery())
        };
    },

    /**
    Joins the `root` URL to the specified _url_, normalizing leading/trailing
    `/` characters.

    @example
        controller.root = '/foo'
        controller._joinURL('bar');  // => '/foo/bar'
        controller._joinURL('/bar'); // => '/foo/bar'

        controller.root = '/foo/'
        controller._joinURL('bar');  // => '/foo/bar'
        controller._joinURL('/bar'); // => '/foo/bar'

    @method _joinURL
    @param {String} url URL to append to the `root` URL.
    @return {String} Joined URL.
    @protected
    **/
    _joinURL: function (url) {
        var root = this.root;

        if (url.charAt(0) === '/') {
            url = url.substring(1);
        }

        return root && root.charAt(root.length - 1) === '/' ?
                root + url :
                root + '/' + url;
    },

    /**
    Parses a URL query string into a key/value hash. If `Y.QueryString.parse` is
    available, this method will be an alias to that.

    @method _parseQuery
    @param {String} query Query string to parse.
    @return {Object} Hash of key/value pairs for query parameters.
    @protected
    **/
    _parseQuery: QS && QS.parse ? QS.parse : function (query) {
        var decode = this._decode,
            params = query.split('&'),
            i      = 0,
            len    = params.length,
            result = {},
            param;

        for (; i < len; ++i) {
            param = params[i].split('=');

            if (param[0]) {
                result[decode(param[0])] = decode(param[1] || '');
            }
        }

        return result;
    },

    /**
    Removes the `root` URL from the from of _path_ (if it's there) and returns
    the result. The returned path will always have a leading `/`.

    @method _removeRoot
    @param {String} path URL path.
    @return {String} Rootless path.
    @protected
    **/
    _removeRoot: function (path) {
        var root = this.root;

        if (root && path.indexOf(root) === 0) {
            path = path.substring(root.length);
        }

        return path.charAt(0) === '/' ? path : '/' + path;
    },

    /**
    Saves a history entry using either `pushState()` or the location hash.

    @method _save
    @param {String} [url] URL for the history entry.
    @param {Boolean} [replace=false] If `true`, the current history entry will
      be replaced instead of a new one being added.
    @chainable
    @protected
    **/
    _save: html5 ? function (url, replace) {
        // Force _ready to true to ensure that the history change is handled
        // even if _save is called before the `ready` event fires.
        this._ready = true;

        this._history[replace ? 'replace' : 'add'](null, {
            url: typeof url === 'string' ? this._joinURL(url) : url
        });
        return this;
    } : function (url, replace) {
        this._ready = true;

        if (typeof url === 'string' && url.charAt(0) !== '/') {
            url = '/' + url;
        }

        HistoryHash[replace ? 'replaceHash' : 'setHash'](url);
        return this;
    },

    // -- Protected Event Handlers ---------------------------------------------

    /**
    Handles `history:change` and `hashchange` events.

    @method _afterHistoryChange
    @param {EventFacade} e
    @protected
    **/
    _afterHistoryChange: function (e) {
        var self = this;

        if (self._ready) {
            // We need to yield control to the UI thread to allow the browser to
            // update window.location before we dispatch.
            setTimeout(function () {
                self._dispatch(self._getPath());
            }, 1);
        }
    },

    // -- Default Event Handlers -----------------------------------------------

    /**
    Default handler for the `ready` event.

    @method _defReadyFn
    @param {EventFacade} e
    @protected
    **/
    _defReadyFn: function (e) {
        var hash;

        this._ready = true;

        if (this.dispatchOnInit && !this._dispatched) {
            if (html5 && (hash = this._getHashPath())
                    && hash.charAt(0) === '/') {

                // This is an HTML5 browser and we have a hash-based path in the
                // URL, so we need to upgrade the URL to a non-hash URL. This
                // will trigger a `history:change` event.
                this._history.replace(null, {url: this._joinURL(hash)});
            } else {
                this._dispatch(this._getPath());
            }
        }
    }
}, {
    NAME: 'controller'
});


}, '@VERSION@' ,{requires:['array-extras', 'base-build', 'history'], optional:['querystring-parse']});
