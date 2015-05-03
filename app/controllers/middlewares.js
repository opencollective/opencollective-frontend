var config = require('config');
var async = require('async');
var utils = require('../lib/utils');

module.exports = function(app) {

  var models = app.set('models');
  var Application = models.Application;
  var User = models.User;
  var errors = app.errors;

  /**
   * Public methods.
   */
  return {

    /**
     *  Parameters required for a route.
     */
    required: function(properties) {
      properties = [].slice.call(arguments);

      return function(req, res, next) {
        var missing = {};
        req.required = {};

        properties.forEach(function(prop) {
          var value = req.params[prop];
          if (!value && value !== false)
            value = req.headers[prop];
          if (!value && value !== false)
            value = req.body[prop];

          if ( (!value || value === 'null') && value !== false ) {
            missing[prop] = 'Required field ' + prop + ' missing';
          } else {
            try { // Try to parse if JSON
              value = JSON.parse(value);
            } catch(e) {}
            req.required[prop] = value;
          }
        });

        if (Object.keys(missing).length) {
          return next(new errors.ValidationFailed('missing_required', missing));
        }

        next();
      };
    },

    /**
     * Check the api_key.
     */
    apiKey: function(req, res, next) {
      var key = req.params['api_key'] || req.body['api_key'];

      if (!key) return next();

      Application.findByKey(key, function(e, application) {
        if (!e && application) {
          if (application.disabled) {
            return next(new errors.Forbidden('Invalid API key.'));
          }
          req.application = application;
        }
        next();
      });
    },

    /**
     * Authenticate.
     */
    authenticate: function(req, res, next) {
      var username = (req.body && req.body.username) || req.params['username']
        , email    = (req.body && req.body.email) || req.params['email']
        , password = (req.body && req.body.password) || req.params['password']
        ;

      if (!req.application || !req.application.api_key) {
        return next();
      }

      if ( !(username || email) || !password ) {
        return next();
      }

      User.auth((username || email), password, function(e, user) {
        if (e) return next();
        req.remoteUser = user;
        next();
      });
    },

    /**
     * Authenticate with a refresh token.
     */
    authenticateRefreshToken: function(req, res, next) {
      var accessToken = req.required.access_token
        , refreshToken = req.required.refresh_token
        ;

      // Decode access token to identify the user.
      jwt.verify(accessToken, secret, function(e) {
        if (e && e.name !== 'TokenExpiredError') // Ok if a old token.
          return next(new errors.Unauthorized('Invalid Token'));

        var decoded = jwt.decode(accessToken);
        User.findOne({_id: decoded.sub}, function(e, user) {
          if (e)
            return next(e);
          else if (!user || user.tokens.refresh_token !== refreshToken) // Check the refresh_token from the user data.
            return next(new errors.Unauthorized('Invalid Refresh Token'));
          else {
            req.remoteUser = user;
            next();
          }
        });
      });
    },

    /**
     * Identify User and Application from the jwtoken.
     *
     *  Use the req.remoteUser._id (from the access_token) to get the full user's model
     *  Use the req.remoteUser.audience (from the access_token) to get the full application's model
     */
    identifyFromToken: function(req, res, next) {
      if (!req.remoteUser)
        return next();

      var app_id = req.remoteUser.aud;

      async.parallel([
        function(cb) {
          User
            .find(req.remoteUser.id)
            .then(function(user) {
              req.remoteUser = user;
              cb();
            })
            .catch(cb);
        },
        function(cb) {
          // Check the validity of the application in the token.
          Application
            .find(parseInt(app_id))
            .then(function(application) {
              if (!application || application.disabled)
                return cb(new errors.Unauthorized('Invalid API key.'));

              req.application = application;
              cb();
            })
            .catch(next);
        }
      ], next);


    },

    /**
     * Authorize application.
     */
     authorizeApp: function(req, res, next) {
      if (!req.application) {
        return next(new errors.Unauthorized('Unauthorized application.'));
      }
      next();
    },


    /**
     * Authorize: the user has to be authenticated.
     */
    authorize: function(req, res, next) {
      if (!req.remoteUser) {
        return next(new errors.Unauthorized('Unauthorized'));
      }
      next();
    },

    /**
     * Authorize User: same user referenced that the authenticated user.
     */
    authorizeUser: function(req, res, next) {
      if (!req.remoteUser || !req.user || (req.remoteUser.id !== req.user.id && req.remoteUser._access === 0)) {
        return next(new errors.Forbidden('Unauthorized'));
      }
      next();
    },

    /**
     * Authorize to get the group.
     */
    authorizeGroup: function(req, res, next) {
      if (!req.group) {
        return next(new errors.NotFound());
      }
      req.group.isMember(req.remoteUser.id, next);
    },

    /**
     * Authorize for group's administrator.
     */
    authorizeGroupAdmin: function(req, res, next) {
      req.group.isMember(req.remoteUser.id, 'admin', next);
    },

    /**
     * Paginate.
     */
    paginate: function(options) {
      options = options || {};

      options = {
          default: options.default || 20
        , min: options.min || 1
        , max: options.max || 50
        , maxTotal: options.maxTotal || false
      };

      return function(req, res, next) {

        // Since ID.
        var since_id = req.body.since_id || req.query.since_id;
        if (since_id) {
          req.pagination = {
            where: {
              id: {$gt: since_id}
            }
          };
          return next();
        }

        // Page / Per_page.
        var per_page = (req.body.per_page || req.query.per_page) * 1 || options.default;
        var page = (req.body.page || req.query.page) * 1 || 1;

        page = (page < 1) ? 1 : page;
        per_page = (per_page < options.min) ? options.min : per_page;
        per_page = (per_page > options.max) ? options.max : per_page;

        req.pagination = utils.paginateOffset(page, per_page);

        next();
      };
    },

    /**
     * Sorting.
     */
    sorting: function(options) {
      options = options || {};

      options.key = (typeof options.key != 'undefined') ? options.key : 'id';
      options.dir = (typeof options.dir != 'undefined') ? options.dir : 'ASC';

      return function(req, res, next) {
        var key = req.body.sort || req.query.sort
          , dir = req.body.direction || req.query.direction;

        req.sorting = {
            key: key || options.key
          , dir: (dir || options.dir).toUpperCase()
        };

        next();
      };
    },

  }

};
