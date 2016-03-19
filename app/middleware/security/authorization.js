var errors = require('../../lib/errors');
var roles = require('../../constants/roles');

const Forbidden = errors.Forbidden;
const NotFound = errors.NotFound;
const Unauthorized = errors.Unauthorized;

/**
 * Middleware related to authorization.
 *
 * NB: first performs authentication.
 */
module.exports = function (app) {

  var aN = require('./authentication')(app);

  return {

    /**
     * Authorize applications with level.
     */
    appAccess: function (level) {

      return function (req, res, next) {
        if (req.application._access < level) {
          return next(new Forbidden('Unauthorized'));
        }
        next();
      };
    },

    _authorizeAccessToUser: function (req, res, next) {
      if (!req.remoteUser || !req.user || (req.remoteUser.id !== req.user.id && req.remoteUser._access === 0)) {
        return next(new Forbidden('Unauthorized'));
      }
      next();
    },

    authorizeUserToAccessUser() {
      return [
        // TODO how to reference aN.authenticateUser() instead of the 3 separate ones?
        aN.parseJwtNoExpiryCheck,
        aN.checkJwtExpiry,
        aN._authenticateUserByJwt,
        this._authorizeAccessToUser
      ];
    },

    authorizeAccessToPublicGroup: (req, res, next) => {
      if (!req.group.isPublic) {
        return next(new Forbidden("Group is not public"));
      }
      next();
    },

    authorizeAppAccessToGroup: (req, res, next) => {
      aN.authenticateApp()(req, res, (e) => {
        if (e) {
          return next(e);
        }
        req.group
          .hasApplication(req.application)
          .then(hasApplication => {
            if (hasApplication) {
              return next();
            }
            next(new Forbidden('Forbidden'));
          })
          .catch(next);
      });
    },

    authorizeUserAccessToGroup: (req, res, next) => {
      aN.authenticateUserByJwt()(req, res, (e) => {
        if (e) {
          return next(e);
        }
        req.group
          .hasUser(req.remoteUser.id)
          .then(hasUser => {
            if (hasUser) {
              return next();
            }
            next(new Forbidden('Forbidden'));
          })
          .catch(next);
      });
    },

    // TODO is there no way to wrap the middlewares into promises to avoid this callback cascade?
    authorizeAccessToGroup(authorizeIfPublic) {
      return (req, res, next) => {
        var _authorizeAccessToGroup = (req, res, next) => {
          this.authorizeUserAccessToGroup(req, res, (e) => {
            if (!e) {
              return next();
            }
            this.authorizeAppAccessToGroup(req, res, next);
          })
        };

        if (authorizeIfPublic) {
          this.authorizeAccessToPublicGroup(req, res, (e) => {
            if (!e) {
              return next();
            }
            _authorizeAccessToGroup(req, res, next);
          });
        } else {
          _authorizeAccessToGroup(req, res, next);
        }
      }
    },

    /**
     * Authorize for group with specific role(s).
     */
    _authorizeGroupRoles: function (roles) {
      return (req, res, next) => {
        if (!req.remoteUser && req.application) { // called with an api_key without user
          return next();
        }
        req.group.hasUserWithRole(req.remoteUser.id, roles, (e, hasUser) => {
          if (e) {
            return next(e);
          }
          if (!hasUser) {
            return next(new Forbidden('Forbidden'));
          }
          next();
        });
      };
    },

    authorizeHost() {
      return this._authorizeGroupRoles([roles.HOST]);
    },

    authorizeHostOrMember() {
      return this._authorizeGroupRoles([roles.HOST, roles.MEMBER]);
    },

    /**
     * Authorize transaction.
     */
    authorizeTransaction: function (req, res, next) {
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
        const userScope = req.jwtPayload.scope;

        if (scope === userScope) {
          return next();
        }

        return next(new Unauthorized('User does not have the scope'));
      }
    }
  }
};
