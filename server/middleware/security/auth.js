import _ from 'lodash';
import config from 'config';

import models from '../../models';
import errors from '../../lib/errors';
import required from '../required_param';
import * as authentication from './authentication';
import { HOST, MEMBER, BACKER } from '../../constants/roles';

const {
  BadRequest,
  Forbidden, // I know who you are, but you permanently don't have access to this resource
  Unauthorized // You are not authorized, try to authenticate again
} = errors;


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

  required('api_key')(req, res, (e) => {
    if (e) return next(e);
    const api_key = req.required.api_key;
    if (api_key !== config.keys.opencollective.api_key)
      return next(new Unauthorized(`Invalid API key: ${api_key}`));
    next();
  });
}

/**
 * Makes sure that the authenticated user is the user that we are trying to access
 */
export function mustBeLoggedInAsUser(req, res, next) {
  required('remoteUser', 'userid')(req, res, (e) => {
    if (e) return next(e);
    if (req.remoteUser !== req.userid) return next(new Forbidden(`The authenticated user (${req.remoteUser.username} cannot edit this user id (${req.userid})`));
    return next();
  });
};

export function mustHaveRole(possibleRoles) {
  if (typeof possibleRoles === 'string')
    possibleRoles = [possibleRoles];

  return (req, res, next) => {
    required('remoteUser', 'groupid')(req, res, (e) => {
      if (e) return next(e);
      models.UserGroup.findOne({ where: {
        UserId: req.remoteUser.id,
        GroupId: req.params.groupid,
        role: { $in: possibleRoles }
      }})
      .then(ug => {
        if (!ug) return next(new Forbidden(`Logged in user must be ${possibleRoles.join(' or ')} of this group`));
        return next();
      })
      .catch(next);
    })
  };
};

export function canEditGroup(req, res, next) {
  return mustHaveRole([HOST, MEMBER])(req, res, next);
};

export function mustBePartOfTheGroup(req, res, next) {
  return mustHaveRole([HOST, MEMBER, BACKER])(req, res, next);
};  

/**
 * Only the author of the expense or the host or an admin of the group can edit an expense
 */
export function canEditExpense(req, res, next) {
  required('remoteUser', 'expenseid')(req, res, (e) => {
    if (e) return next(e);
    models.Expense
      .findOne({ where: {
        id: req.params.expenseid,
        UserId: req.remoteUser.id
      }})
      .then(expense => {
        if (expense) return next();

        canEditGroup(req, res, (err) => {
          if (!err) return next(new Forbidden('Logged in user must be the author of the expense or the host or an admin of this group'));
          return next();
        });
      })
      .catch(next);
  });
}

/**
 * Only the author of the donation or the host or an admin of the group can edit a donation
 */
export function canEditDonation (req, res, next) {
  required('remoteUser', 'donation')(req, res, (e) => {
    if (e) return next(e);
    if (req.donation.UserId === req.remoteUser.id) return next();
    mustHaveRole([HOST, MEMBER])(req, res, (err) => {
      if (!err) return next(new Forbidden('Logged in user must be the author of the donation or the host or an admin of this group'));
      return next();
    });
  });
}