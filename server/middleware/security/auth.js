import config from 'config';

import errors from '../../lib/errors';
import {required_valid} from '../required_param';
import roles from '../../constants/roles';
import {authenticateUser} from './authentication';
import { hasRole } from '../../lib/auth';

const {
  Forbidden, // I know who you are, but you permanently don't have access to this resource
  Unauthorized // You are not authorized, try to authenticate again
} = errors;

const {
  HOST,
  ADMIN,
  BACKER
} = roles;

/**
 * Authorize api_key
 * 
 * All calls should provide a valid api_key
 */
export function authorizeApiKey(req, res, next) {

  // TODO: we should remove those exceptions
  // those routes should only be accessed via the website (which automatically adds the api_key)
  const exceptions = [
    { method: 'GET', regex: /^\/collectives\/[0-9]+\/transactions\/[0-9]+\/callback\?token=.+&paymentId=.+&PayerID=.+/ }, // PayPal callback
    { method: 'GET', regex: /^\/collectives\/[0-9]+\/transactions\/[0-9]+\/callback\?token=.+/ }, // PayPal callback
    { method: 'POST', regex: /^\/webhooks\/[mailgun|stripe]/ },
    { method: 'GET', regex: /^\/connected-accounts\/stripe\/callback/ },
    { method: 'GET', regex: /^\/services\/email\/approve\?messageId=.+/ },
    { method: 'GET', regex: /^\/services\/email\/unsubscribe\/(.+)\/([a-zA-Z0-9-_]+)\/([a-zA-Z0-9-_\.]+)\/.+/ }
  ];

  for (const i in exceptions) {
    if (req.method === exceptions[i].method && req.originalUrl.match(exceptions[i].regex)) return next();
  }

  required_valid('api_key')(req, res, (e) => {
    if (e) return next(e);
    const api_key = req.required.api_key;
    if (api_key !== config.keys.opencollective.api_key)
      return next(new Unauthorized(`Invalid API key: ${api_key}`));
    next();
  });
}

/**
 * Makes sure that the user the is logged in and req.remoteUser is populated.
 * if we cannot authenticate the user, we directly return an Unauthorized error. 
 */
export function mustBeLoggedIn(req, res, next) {
  authenticateUser(req, res, (e) => {
    if (e) return next(e);
    if (!req.remoteUser) return next(new Unauthorized("User is not authenticated"));
    else return next();
  });
}

/**
 * Makes sure that the authenticated user is the user that we are trying to access (as defined by req.params.userid)
 */
export function mustBeLoggedInAsUser(req, res, next) {
  required_valid('remoteUser', 'userid')(req, res, (e) => {
    if (e) return next(e);
    if (req.remoteUser.id !== parseInt(req.params.userid, 10)) return next(new Forbidden(`The authenticated user (${req.remoteUser.username}) cannot edit this user id (${req.params.userid})`));
    return next();
  });
}

export function mustHaveRole(possibleRoles) {
  if (typeof possibleRoles === 'string')
    possibleRoles = [possibleRoles];

  return (req, res, next) => {
    required_valid('remoteUser', 'collective')(req, res, (e) => {
      if (e) return next(e);
      if (!req.remoteUser) return next(new Forbidden()); // this shouldn't happen, need to investigate why it does
      return hasRole(req.remoteUser.CollectiveId, req.collective.id, possibleRoles)
      .then(hasRole => {
        if (!hasRole) return next(new Forbidden(`Logged in user must be ${possibleRoles.join(' or ')} of this collective`));
        else return next(null, true);
      })
      .catch(next);
    })
  };
}

export function canEditCollective(req, res, next) {
  return mustHaveRole([HOST, ADMIN])(req, res, next);
}

export function mustBePartOfTheCollective(req, res, next) {
  return mustHaveRole([HOST, ADMIN, BACKER])(req, res, next);
}

/**
 * Only the author of the object or the host or an admin member of the collective can edit the object
 */
export function canEditObject(object) {
  return (req, res, next) => {
    required_valid('remoteUser', object)(req, res, (e) => {
      if (e) return next(e, false);
      if (req[object].UserId === req.remoteUser.id) return next(null, true);
      mustHaveRole([HOST, ADMIN])(req, res, (err) => {
        if (err) return next(new Forbidden(`Logged in user must be the author of the ${object} or the host or an admin of this collective`), false);
        return next(null, true);
      });
    });
  }
}


/**
 * Only the author of the expense or the host or an admin member of the collective can edit an expense
 */
export function canEditExpense(req, res, next) {
  return canEditObject('expense')(req, res, next);
}

/**
 * Only the author of the order or the host or an admin member of the collective can edit a order
 */
export function canEditOrder (req, res, next) {
  return canEditObject('order')(req, res, next);
}