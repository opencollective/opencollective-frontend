var _ = require('lodash');
var async = require('async');
var utils = require('../lib/utils');

module.exports = function(app) {

  var models = app.set('models');
  var Application = models.Application;
  var User = models.User;
  var errors = app.errors;
  var users = require('../controllers/users')(app);

  /**
   * Public methods.
   */
  return {

    /**
     * Get the user based on its email or paypalEmail. If not found, creates one.
     * Used for creating a transaction from a new/returning donor or an expense from a new/returning user.
     */
    getOrCreateUser: (req, res, next) => {

      // If already logged in, proceed
      if(req.remoteUser) {
        req.user = req.remoteUser;
        return next();
      }

      var email, paypalEmail, password;

      // TODO remove #postmigration, replaced by req.body.expense
      if(req.body.transaction) {
        email = req.body.transaction.email;
        paypalEmail = req.body.transaction.paypalEmail;
      }
      else if(req.body.expense) {
        email = req.body.expense.email;
        paypalEmail = req.body.expense.paypalEmail;
      }
      // TODO remove #postmigration
      else if(req.body.payment) {
        email = req.body.payment.email;
      }

      password = req.body.password || req.query.password;

      if(!email && !paypalEmail) {
        return next(new errors.ValidationFailed("Email or paypalEmail required"));
      }

      if (password) {
        return this.authenticate(req, res, next);
      }

      const cb = (err, user) => {
        if(user) req.user = user;
        return next();
      }

      models.User.findOne({
        where: {
          $or: {
            email,
            paypalEmail
          }
        }
      })
      .then((user) => {
        if (user) {
          cb(null, user);
        } else {
          const userData = {
            email: email || paypalEmail,
            paypalEmail
          };
          users._create(userData, cb);
        }
      })
      .catch(cb);

    },

    /**
     * Check the api_key.
     */
    apiKey: function(req, res, next) {
      var key = req.query.api_key || req.body.api_key;

      if (!key) return next();

      Application.findByKey(key, (e, application) => {
        if (e) {
          return next(e);
        }

        if (!application) {
          return next(new errors.Unauthorized(`Invalid API key: ${key}`));
        }

        if (application.disabled) {
          return next(new errors.Forbidden('Application disabled'));
        }

        req.application = application;

        next();
      });
    },

    /**
     * Authenticate.
     */
    authenticate: function(req, res, next) {
      var username = (req.body && req.body.username) || req.query.username;
      var email = (req.body && req.body.email) || req.query.email;
      var password = (req.body && req.body.password) || req.query.password;
      if (!req.application || !req.application.api_key) {
        return next();
      }

      if (!(username || email) || !password) {
        return next();
      }

      User.auth((username || email), password, (e, user) => {

        var errorMsg = 'Invalid username/email or password';

        if (e) {
          if (e.code === 400) {
            return next(new errors.BadRequest(errorMsg));
          }
          else {
            return next(new errors.ServerError(e.message));
          }
        }

        if (!user) {
          return next(new errors.BadRequest(errorMsg));
        }

        req.remoteUser = user;
        req.user = req.remoteUser;

        next();
      });
    },

    /**
     * Identify User and Application from the jwtoken.
     *
     *  Use the req.remoteUser._id (from the access_token) to get the
     *    full user's model
     *  Use the req.remoteUser.audience (from the access_token) to get the
     *    full application's model
     */
    identifyFromToken: function(req, res, next) {
      if (!req.jwtPayload || !req.jwtPayload.sub) {
        return next();
      }
      async.parallel([
        function(cb) {
          User
            .find(req.jwtPayload.sub)
            .then((user) => {
              req.remoteUser = user;
              cb();
            })
            .catch(cb);
        },
        function(cb) {
          const appId = parseInt(req.jwtPayload.aud);

          // Check the validity of the application in the token.
          Application
            .find(appId)
            .then((application) => {
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
     * Or a user or an Application has to be authenticated.
     */
    authorizeAuthUserOrApp: function(req, res, next) {
       if (!req.remoteUser && !req.application) {
         return next(new errors.Unauthorized('Unauthorized'));
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

      async.parallel([
        function(cb) { // If authenticated user, does he have access?
          if (!req.remoteUser) {
            return cb();
          }

          req.group.hasUser(req.remoteUser.id)
            .then((hasUser) => cb(null, hasUser))
            .catch(cb);
        },
        function(cb) { // If authenticated application, does it have access?
          if (!req.application) {
            return cb();
          }

          req.group
            .hasApplication(req.application)
            .then((bool) => cb(null, bool))
            .catch(cb);
        }

      ], (e, results) => {
        if (e) {
          return next(e);
        } else if (_.some(results)) {
          return next();
        } else {
          return next(new errors.Forbidden('Unauthorized'));
        }
      });
    },

    /**
     * Authorize if group is public
     */
    authorizeIfGroupPublic: function(req, res, next) {
      if (req.group && req.group.isPublic) {
        return next('route'); // bypass the callbacks
      }

      return next();
    },

    /**
     * Paginate.
     */
    paginate: function(options) {
      options = options || {};

      options = {
        default: options.default || 20,
        min: options.min || 1,
        max: options.max || 50,
        maxTotal: options.maxTotal || false
      };

      return function(req, res, next) {

        // Since ID.
        var sinceId = req.body.since_id || req.query.since_id;
        if (sinceId) {
          req.pagination = {
            where: {
              id: {$gt: sinceId}
            }
          };
          return next();
        }

        // Page / Per_page.
        var perPage = (req.body.per_page || req.query.per_page);
        perPage = perPage * 1 || options.default;
        var page = (req.body.page || req.query.page) * 1 || 1;

        page = (page < 1) ? 1 : page;
        perPage = (perPage < options.min) ? options.min : perPage;
        perPage = (perPage > options.max) ? options.max : perPage;

        req.pagination = utils.paginateOffset(page, perPage);

        next();
      };
    },

    /**
     * Sorting.
     */
    sorting: function(options) {
      options = options || {};

      options.key = (typeof options.key !== 'undefined') ? options.key : 'id';
      options.dir = (typeof options.dir !== 'undefined') ? options.dir : 'ASC';

      return function(req, res, next) {
        var key = req.body.sort || req.query.sort;
        var dir = req.body.direction || req.query.direction;

        req.sorting = {
          key: key || options.key,
          dir: (dir || options.dir).toUpperCase()
        };

        next();
      };
    },

    checkJWTExpiration: (req, res, next) => {
      if (req.jwtExpired) {
        return next(new errors.CustomError(401, 'jwt_expired', 'jwt expired'));
      }

      return next();
    }

  };

};
