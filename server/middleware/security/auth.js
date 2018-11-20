import config from 'config';
import debug from 'debug';

import errors from '../../lib/errors';
import { required_valid } from '../required_param';
import roles from '../../constants/roles';
import { authenticateUser } from './authentication';

import models from '../../models';

const {
  BadRequest,
  Forbidden, // I know who you are, but you permanently don't have access to this resource
  Unauthorized, // You are not authorized, try to authenticate again
} = errors;

const { HOST, ADMIN, BACKER } = roles;

/**
 * Check Client App
 *
 * Check Client Id if it exists
 */
export async function checkClientApp(req, res, next) {
  const apiKey = req.get('Api-Key') || req.query.apiKey || req.apiKey;
  const clientId = req.get('Client-Id') || req.query.clientId;
  if (apiKey) {
    const app = await models.Application.findOne({
      where: { type: 'apiKey', apiKey },
    });
    if (app) {
      debug('auth')('Valid Client App (apiKey)');
      req.clientApp = app;
      const collectiveId = app.CollectiveId;
      if (collectiveId) {
        req.loggedInAccount = await models.Collective.findById(collectiveId);
        req.remoteUser = await models.User.findOne({
          where: { CollectiveId: collectiveId },
        });
        if (req.remoteUser) {
          await req.remoteUser.populateRoles();
        }
      }
      next();
    } else {
      debug('auth')(`Invalid Client App (apiKey: ${apiKey}).`);
      next(new Unauthorized(`Invalid Api Key: ${apiKey}.`));
    }
  } else if (clientId) {
    const app = await models.Application.findOne({
      type: 'oAuth',
      where: { clientId },
    });
    if (app) {
      debug('auth')('Valid Client App');
      req.clientApp = app;
      next();
    } else {
      debug('auth')(`Invalid Client App (clientId: ${clientId}).`);
      next(new Unauthorized(`Invalid Client Id: ${clientId}.`));
    }
  } else {
    next();
    debug('auth')('No Client App');
  }
}

/**
 * Authorize api_key
 *
 * All calls should provide a valid api_key
 */
export function authorizeClientApp(req, res, next) {
  // TODO: we should remove those exceptions
  // those routes should only be accessed via the website (which automatically adds the api_key)
  const exceptions = [
    {
      method: 'GET',
      regex: /^\/collectives\/[0-9]+\/transactions\/[0-9]+\/callback\?token=.+&paymentId=.+&PayerID=.+/,
    }, // PayPal callback
    {
      method: 'GET',
      regex: /^\/collectives\/[0-9]+\/transactions\/[0-9]+\/callback\?token=.+/,
    }, // PayPal callback
    { method: 'POST', regex: /^\/webhooks\/(mailgun|stripe)/ },
    {
      method: 'GET',
      regex: /^\/connected-accounts\/(stripe|paypal)\/callback/,
    },
    { method: 'GET', regex: /^\/services\/email\/approve\?messageId=.+/ },
    {
      method: 'GET',
      regex: /^\/services\/email\/unsubscribe\/(.+)\/([a-zA-Z0-9-_]+)\/([a-zA-Z0-9-_\.]+)\/.+/,
    },
  ];

  for (const i in exceptions) {
    if (
      req.method === exceptions[i].method &&
      req.originalUrl.match(exceptions[i].regex)
    )
      return next();
  }

  const apiKey =
    req.get('Api-Key') ||
    req.query.apiKey ||
    req.query.api_key ||
    req.body.api_key;
  if (req.clientApp) {
    debug('auth')('Valid Client App');
    next();
  } else if (apiKey === config.keys.opencollective.api_key) {
    debug('auth')(`Valid API key: ${apiKey}`);
    next();
  } else if (apiKey) {
    debug('auth')(`Invalid API key: ${apiKey}`);
    next(new Unauthorized(`Invalid API key: ${apiKey}`));
  } else {
    debug('auth')('Missing API key or Client Id');
    next(new BadRequest('Missing API key or Client Id'));
  }
}

/**
 * Makes sure that the user the is logged in and req.remoteUser is populated.
 * if we cannot authenticate the user, we directly return an Unauthorized error.
 */
export function mustBeLoggedIn(req, res, next) {
  authenticateUser(req, res, e => {
    if (e) return next(e);
    if (!req.remoteUser)
      return next(new Unauthorized('User is not authenticated'));
    else return next();
  });
}

/**
 * Makes sure that the authenticated user is the user that we are trying to access (as defined by req.params.userid)
 */
export function mustBeLoggedInAsUser(req, res, next) {
  required_valid('remoteUser', 'userid')(req, res, e => {
    if (e) return next(e);
    if (req.remoteUser.id !== parseInt(req.params.userid, 10))
      return next(
        new Forbidden(
          `The authenticated user (${
            req.remoteUser.username
          }) cannot edit this user id (${req.params.userid})`,
        ),
      );
    return next();
  });
}

export function mustHaveRole(possibleRoles) {
  if (typeof possibleRoles === 'string') possibleRoles = [possibleRoles];

  return (req, res, next) => {
    required_valid('remoteUser', 'collective')(req, res, e => {
      if (e) return next(e);
      if (!req.remoteUser) return next(new Forbidden()); // this shouldn't happen, need to investigate why it does
      // If must be HOST, the logged in user can also be an ADMIN of the HOST
      if (possibleRoles.indexOf(roles.HOST) !== -1) {
        if (
          req.remoteUser.hasRole([roles.ADMIN], req.collective.HostCollectiveId)
        )
          return next(null, true);
      }
      if (!req.remoteUser.hasRole(possibleRoles, req.collective.id))
        return next(
          new Forbidden(
            `Logged in user must be ${possibleRoles.join(
              ' or ',
            )} of this collective`,
          ),
        );
      else return next(null, true);
    });
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
    required_valid('remoteUser', object)(req, res, e => {
      if (e) return next(e, false);
      if (req[object].UserId === req.remoteUser.id) return next(null, true);
      mustHaveRole([HOST, ADMIN])(req, res, err => {
        if (err)
          return next(
            new Forbidden(
              `Logged in user must be the author of the ${object} or the host or an admin of this collective`,
            ),
            false,
          );
        return next(null, true);
      });
    });
  };
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
export function canEditOrder(req, res, next) {
  return canEditObject('order')(req, res, next);
}
