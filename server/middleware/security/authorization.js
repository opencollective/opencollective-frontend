const moment = require('moment-timezone');
const errors = require('../../lib/errors');

const Forbidden = errors.Forbidden;
const NotFound = errors.NotFound;
const Unauthorized = errors.Unauthorized;

/**
 * Middleware related to authorization.
 *
 * NB: first performs authentication.
 */
module.exports = function (app) {

  const aN = require('./authentication')(app);
  const models = app.set('models');

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

    _authorizeUserToAccessUser: (req, res, next) => {
      if (!req.remoteUser || !req.user || (req.remoteUser.id !== req.user.id && req.remoteUser._access === 0)) {
        return next(new Forbidden('Unauthorized'));
      }
      next();
    },

    authorizeUserToAccessUser() {
      return (req, res, next) => {
        aN.authenticateUserByJwt()(req, res, (e) => {
          if (e) {
            return next(e);
          }
          this._authorizeUserToAccessUser(req, res, next);
        });
      };
    },

    _authorizeUserAccessToScope(scope) {
      return (req, res, next) => {
        const userScope = req.jwtPayload.scope;
        if (!scope || scope === userScope) {
          return next();
        }
        return next(new Unauthorized('User does not have the scope'));
      }
    },

    authorizeUserToAccessScope(scope) {
      return (req, res, next) => {
        aN.authenticateUserByJwt()(req, res, (e) => {
          if (e) {
            return next(e);
          }
          this._authorizeUserAccessToScope(scope)(req, res, next);
        });
      };
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
          .tap(hasApplication => {
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
          // can't use hasUser() because we removed the unique index of groupid, userid
          // and replaced it with a unique index of groupid, userid, and role and
          // that breaks user-related calls for Groups on Sequelize
          .getUsers({
            where: {
              id: req.remoteUser.id
            }
          })
          .tap(users => {
            if (users.length > 0) {
              return next();
            }
            next(new Forbidden('Forbidden'));
          })
          .catch(next);
      });
    },


    /**
     * Authorize only users with the specified roles.
     */
    _authorizeUserRoles: function (options) {
      return (req, res, next) => {
        if (!options.userRoles) {
          return next();
        }
        if (options.bypassUserRolesCheckIfAuthenticatedAsAppAndNotUser && !req.remoteUser && req.application) { // called with an api_key without user
          return next();
        }
        req.group.hasUserWithRole(req.remoteUser.id, options.userRoles, (e, hasUser) => {
          if (e) {
            return next(e);
          }
          if (!hasUser) {
            return next(new Forbidden('User does not have expected role'));
          }
          next();
        });
      };
    },

    // TODO is there no way to wrap the middlewares into promises to avoid this callback cascade?
    authorizeAccessToGroup(options) {
      if (!options) options = {};
      return (req, res, next) => {
        const _authorizeAccessToGroup = () => {
          this.authorizeUserAccessToGroup(req, res, (e) => {
            if (!e) {
              return this._authorizeUserRoles(options)(req, res, next);
            }
            this.authorizeAppAccessToGroup(req, res, (e) => {
              if (e) {
                return next(e);
              }
              this._authorizeUserRoles(options)(req, res, next)
            });
          })
        };

        if (options.authIfPublic) {
          this.authorizeAccessToPublicGroup(req, res, (e) => {
            if (!e) {
              return next();
            }
            _authorizeAccessToGroup();
          });
        } else {
          _authorizeAccessToGroup();
        }
      }
    },

    authorizeGroupAccessTo(attributeName, options) {
      if (!options) options = {};
      return (req, res, next) => {
        const _authorizeAccess = () => {
          // TODO shouldn't return NotFound before authorization check
          if (!req[attributeName]) {
            return next(new NotFound());
          }
          if (!req.group) {
            return next(new NotFound('Cannot authorize a transaction without a specified group.'));
          }
          if (req[attributeName].GroupId !== req.group.id) {
            return next(new Forbidden(`This group does not have access to attribute ${attributeName}`));
          }
          next();
        };

        if (options.authIfPublic) {
          this.authorizeAccessToPublicGroup(req, res, (e) => {
            if (!e) {
              return next();
            }
            _authorizeAccess();
          });
        } else {
          _authorizeAccess();
        }
      }
    },

    authorizeGroupAccessToTransaction(options) {
      return this.authorizeGroupAccessTo('transaction', options);
    },

    authorizeAccessToUserWithRecentDonation: (req, res, next) => {
      models.Donation.findOne({
        where: {
          UserId: req.user.id,
          updatedAt: {
            $gt: moment().add(-10, 'minutes').format()
          }
        }
      })
        .tap(donation => {
          if (!donation) {
            return next(new Unauthorized("Can only modify user who had donation in last 10 min"));
          }
          next();
        })
        .catch(next);
    }
  }
};
