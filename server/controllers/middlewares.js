const async = require('async');
const utils = require('../lib/utils');
const Promise = require('bluebird');
const json2csv = require('json2csv');
const moment = require('moment');
const _ = require('lodash');

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
     * Add this middleware before the controller (before calling res.send)
     * `format` should be 'csv'
     */
    format: (format) => {

      return (req, res, next) => {

        switch(format) {
          case 'csv':
            const send = res.send;
            res.send = (data) => {
              data = _.map(data, (row) => {
                if(row.createdAt)
                  row.createdAt = moment(row.createdAt).format("YYYY-MM-DD HH:mm");

                return row;
              });
              json2csv({data, fields: Object.keys(data[0])}, (err, csv) => {
                res.setHeader('content-type', 'text/csv');
                send.call(res, csv);
              });
            }
            return next();

          default:
            return next();
        }

      }

    },

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

      var name, email, paypalEmail, password;

      // TODO remove #postmigration, replaced by req.body.expense
      if(req.body.transaction) {
        email = req.body.transaction.email;
        paypalEmail = req.body.transaction.paypalEmail;
        name = req.body.transaction.name;
      }
      else if(req.body.expense) {
        email = req.body.expense.email;
        paypalEmail = req.body.expense.paypalEmail;
        name = req.body.expense.name;
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

      const userData = {
        name,
        email: email || paypalEmail,
        paypalEmail
      };
      models.User.findOne({
        where: {
          $or: {
            email: userData.email,
            paypalEmail: userData.paypalEmail
          }
        }
      })
      .then(user => user || users._create(userData))
      .tap(user => req.user = user)
      .tap(() => next())
      .catch(next);

    },

    /**
     * Check the api_key.
     */
    apiKey: function(req, res, next) {
      var key = req.query.api_key || req.body.api_key;

      if (!key) return next();

      Application.findByKey(key).tap(application => {
        if (!application) {
          return next(new errors.Unauthorized(`Invalid API key: ${key}`));
        }

        if (application.disabled) {
          return next(new errors.Forbidden('Application disabled'));
        }

        req.application = application;

        next();
      })
      .catch(next);
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
            .findById(req.jwtPayload.sub)
            .tap((user) => {
              req.remoteUser = user;
              cb();
            })
            .catch(cb);
        },
        function(cb) {
          const appId = parseInt(req.jwtPayload.aud);

          // Check the validity of the application in the token.
          Application
            .findById(appId)
            .tap((application) => {
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

      const checkUserAccess = () => {
        if (!req.remoteUser) {
          return Promise.resolve(false);
        }
        return req.group.hasUser(req.remoteUser.id);
      };

      const checkAppAccess = () => {
        if (!req.application) {
          return Promise.resolve();
        }

        return req.group.hasApplication(req.application);
      };

      Promise.reduce([checkUserAccess(), checkAppAccess()], (total, auth) => total || auth)
        .tap(hasAccess => {
          if (!hasAccess) {
            return next(new errors.Forbidden('Unauthorized'));
          }
          next();
        })
        .catch(next);
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
