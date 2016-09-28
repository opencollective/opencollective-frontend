import errors from '../../lib/errors';
import * as aN from './authentication';
import required from '../required_param';
import config from 'config';

const {
  Forbidden,
  NotFound,
  Unauthorized
} = errors;

/**
 * Middleware related to authorization.
 *
 * if we cannot authenticate the user, we directly return an Unauthorized error. 
 */

export function authorizeUser() {
  return (req, res, next) => {
    aN.authenticateUser()(req, res, (e) => {
      if (e) {
        return next(e);
      }
      if (!req.remoteUser) return next(new Unauthorized("User is not authenticated"));
      return next();
    });
  };
}

export function authorizeUserToAccessUser() {
  const _authorizeUserToAccessUser = (req, res, next) => {
    if (!req.remoteUser || !req.user || (req.remoteUser.id !== req.user.id && req.remoteUser._access === 0)) {
      return next(new Forbidden('Unauthorized'));
    }
    next();
  };

  return (req, res, next) => {
    aN.authenticateUser()(req, res, (e) => {
      if (e) {
        return next(e);
      }
      _authorizeUserToAccessUser(req, res, next);
    });
  };
}


export function authorizeUserToAccessScope(scope) {

  return (req, res, next) => {
    aN.authenticateUser()(req, res, (e) => {
      if (e) return next(e);

      return (req, res, next) => {
        const userScope = req.jwtPayload.scope;
        if (!scope || scope === userScope) return next();
        return next(new Unauthorized('User does not have access to this scope'));
      }
    });
  };
}

/**
 * Authenticate the user via its JWT token
 * Returns a Forbidden error if the user doesn't belong to req.group
 * 
 * @PRE: JWT token passed in the `Authorization: Bearer [token]` header
 *       req.group
 * @POST: req.remoteUser is set
 */
export const _authorizeUserAccessToGroup = (req, res, next) => {
  if (!req.remoteUser) return next(new Unauthorized("User is not authenticated"));
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
      next(new Forbidden(`User doesn't have access to this group`));
    })
    .catch(next);
};

/**
 * Authorizes users with the specified roles
 * 
 * @PRE: options.userRoles[] (optional)
 *       req.remoteUser
 *       req.group
 * @POST: returns a Forbidden error if user doesn't have one of the roles specified in options.userRoles[]
 *        continues if it does or if options.userRoles is not specified
 */
export function _authorizeUserRoles (options) {
  return (req, res, next) => {
    if (!options.userRoles) {
      return next();
    }
    req.group.hasUserWithRole(req.remoteUser.id, options.userRoles, (e, hasUser) => {
      if (e) return next(e);
      if (!hasUser) return next(new Forbidden(`User does not have one of the expected role: ${options.userRoles.join(', ')}`));
      return next();
    });
  };
}

/**
 * Grants access if the logged in user has access to the group
 * Authenticates the user with its JWT token if any
 * then it grants access if there is no required roles passed in options.userRoles[]
 * OR if the user has one of the roles specified in options.userRoles[]
 * 
 * @PRE: (optional) a valid JWT token in the `Authorization: Bearer [token]` header to authenticate the user
 * @POST: req.remoteUser is set to the logged in user if any
 */
// @TODO is there no way to wrap the middlewares into promises to avoid this callback cascade?
export function authorizeAccessToGroup(options = {}) {
  return (req, res, next) => {
    const handleAuthCallback = (e, res) => {
      if (e && options.allowNonAuthenticatedAccess) return next();
      else return next(e, res);
    };

    aN.authenticateUser()(req, res, (e) => {
      if (!req.remoteUser)
        e = new Unauthorized('User is not authenticated');

      if (e) return handleAuthCallback(e);

      this._authorizeUserAccessToGroup(req, res, (e) => {
        if (!e) return this._authorizeUserRoles(options)(req, res, handleAuthCallback);
        else return handleAuthCallback(e);
      });
    });
  };
}

export function authorizeGroupAccessTo(attributeName, options = {}) {
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

    if (options.allowNonAuthenticatedAccess)
      return next();
    else
      return _authorizeAccess();
  }
}

export function authorizeGroupAccessToTransaction(options) {
  return this.authorizeGroupAccessTo('transaction', options);
}