var _ = require('lodash');
var errors = require('../../lib/errors');
var authenticateUser = require('./authentication').authenticateUser;

const Forbidden = errors.Forbidden;
const NotFound = errors.NotFound;
const Unauthorized = errors.Unauthorized;

/**
 * Middleware related to authorization.
 *
 * NB: first performs authentication.
 */
module.exports = {

  /**
   * Authorize applications with level.
   */
  appAccess: function(level) {

    return function(req, res, next) {
      if (req.application._access < level) {
        return next(new Forbidden('Unauthorized'));
      }
      next();
    };
  },

  _authorizeAccessToUser: function(req, res, next) {
    console.log("_authorizeAccessToUser");
    if (!req.remoteUser || !req.user || (req.remoteUser.id !== req.user.id && req.remoteUser._access === 0)) {
      return next(new Forbidden('Unauthorized'));
    }
    next();
  },

  authorizeAccessToUser: [
    authenticateUser,
    this._authorizeAccessToUser
  ],

  /**
   * Authorize access to group, either as application, or as user
   */
  authorizeGroup: function(req, res, next) {
    // TODO shouldn't expose "not found" prior to authentication check
    if (!req.group) {
      return next(new NotFound());
    }
    if (req.group.isPublic) {
      return next();
    }

    async.parallel([
      function(cb) { // If authenticated user, does he have access?
        if (!req.remoteUser) {
          return cb();
        }

        req.group
          .hasUser(req.remoteUser.id)
          .then(hasUser => {
            cb(null, hasUser);
          })
          .catch(cb);
      },
      function(cb) { // If authenticated application, does it have access?
        if (!req.application) {
          return cb();
        }

        req.group
          .hasApplication(req.application)
          .then(hasApplication => {
            return cb(null, hasApplication);
          })
          .catch(cb);
      }

    ], function(e, results) {
      if (e) {
        return next(e);
      } else if (_.some(results)) {
        return next();
      } else {
        return next(new Forbidden('Unauthorized'));
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
   * Authorize for group with specific role(s).
   */
  authorizeGroupRoles: function(roles) {
    var roles = _.isArray(roles) ? roles : [roles];

    return function(req, res, next) {
      if (!req.remoteUser && req.application) // called with an api_key without user
        return next();

      req.group.hasUserWithRole(req.remoteUser.id, roles, function(err, hasUser) {
        if (err) return next(err);
        if (!hasUser) return next(new Forbidden('Unauthorized'));

        return next();
      });
    };
  },

  /**
   * Authorize transaction.
   */
  authorizeTransaction: function(req, res, next) {
    if (!req.transaction) {
      return next(new NotFound());
    }

    if (!req.group) {
      return next(new NotFound('Cannot authorize a transaction without a specified group.'));
    }

    if (req.transaction.GroupId !== req.group.id) {
      return next(new Forbidden('This group does not have access to this transaction.'));
    }

    next();
  },

  jwtScope: (scope) => {
    return (req, res, next) => {
      console.log("jwtScope");
      const userScope = req.jwtPayload.scope;

      if (scope === userScope) {
        return next();
      }

      return next(new Unauthorized('User does not have the scope'));
    }
  }
};
