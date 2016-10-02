import config from 'config';

import models from '../../models';
import errors from '../../lib/errors';
import {required_valid} from '../required_param';
import roles from '../../constants/roles';
import {authenticateUser} from './authentication';

const {
  NotFound,
  Forbidden, // I know who you are, but you permanently don't have access to this resource
  Unauthorized // You are not authorized, try to authenticate again
} = errors;

const {
  HOST,
  MEMBER,
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
    { method: 'GET', regex: /^\/groups\/[0-9]+\/transactions\/[0-9]+\/callback\?token=.+&paymentId=.+&PayerID=.+/ }, // PayPal callback
    { method: 'GET', regex: /^\/groups\/[0-9]+\/transactions\/[0-9]+\/callback\?token=.+/ }, // PayPal callback
    { method: 'POST', regex: /^\/webhooks\/[mailgun|stripe]/ },
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
    required_valid('remoteUser', 'group')(req, res, (e) => {
      if (e) return next(e);
      if (!req.remoteUser) return next(new Forbidden()); // this shouldn't happen, need to investigate why it does'
      const query = {
        where: {
          UserId: req.remoteUser.id,
          GroupId: req.group.id,
          role: { $in: possibleRoles }
        }
      };
      models.UserGroup.findOne(query)
      .then(ug => {
        if (!ug) return next(new Forbidden(`Logged in user must be ${possibleRoles.join(' or ')} of this group`));
        else return next(null, true);
      })
      .catch(next);
    })
  };
}

export function canEditGroup(req, res, next) {
  return mustHaveRole([HOST, MEMBER])(req, res, next);
}

export function mustBePartOfTheGroup(req, res, next) {
  return mustHaveRole([HOST, MEMBER, BACKER])(req, res, next);
}

/**
 * Only the author of the expense or the host or an admin of the group can edit an expense
 */
export function canEditExpense(req, res, next) {
  required_valid('remoteUser', 'expenseid')(req, res, (e) => {
    if (e) return next(e);
    models.Expense
      .findOne({ where: {
        id: req.params.expenseid
      }})
      .then(expense => {
        if (!expense) return NotFound();        
        if (expense.UserId === req.remoteUser.id) return next(null, true);
        req.params.groupid = expense.GroupId;
        canEditGroup(req, res, (err) => {
          if (err) return next(new Forbidden('Logged in user must be the author of the expense or the host or an admin of this group'));
          return next(null, true);
        });
      })
      .catch(next);
  });
}

/**
 * Only the author of the donation or the host or an admin of the group can edit a donation
 */
export function canEditDonation (req, res, next) {
  required_valid('remoteUser', 'donation')(req, res, (e) => {
    if (e) return next(e);
    if (req.donation.UserId === req.remoteUser.id) return next();
    mustHaveRole([HOST, MEMBER])(req, res, (err) => {
      if (!err) return next(new Forbidden('Logged in user must be the author of the donation or the host or an admin of this group'));
      return next();
    });
  });
}