import config from 'config';
import debugLib from 'debug';

import errors from '../../lib/errors';
import { authenticateUser } from './authentication';

import models from '../../models';

const { Unauthorized } = errors;

const debug = debugLib('auth');

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
      debug('Valid Client App (apiKey)');
      req.clientApp = app;
      const collectiveId = app.CollectiveId;
      if (collectiveId) {
        req.loggedInAccount = await models.Collective.findByPk(collectiveId);
        req.remoteUser = await models.User.findOne({
          where: { CollectiveId: collectiveId },
        });
        if (req.remoteUser) {
          await req.remoteUser.populateRoles();
        }
      }
      next();
    } else {
      debug(`Invalid Client App (apiKey: ${apiKey}).`);
      next(new Unauthorized(`Invalid Api Key: ${apiKey}.`));
    }
  } else if (clientId) {
    const app = await models.Application.findOne({
      type: 'oAuth',
      where: { clientId },
    });
    if (app) {
      debug('Valid Client App');
      req.clientApp = app;
      next();
    } else {
      debug(`Invalid Client App (clientId: ${clientId}).`);
      next(new Unauthorized(`Invalid Client Id: ${clientId}.`));
    }
  } else {
    next();
    debug('No Client App');
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
    if (req.method === exceptions[i].method && req.originalUrl.match(exceptions[i].regex)) {
      return next();
    }
  }

  const apiKey = req.get('Api-Key') || req.query.apiKey || req.query.api_key || req.body.api_key;
  if (req.clientApp) {
    debug('Valid Client App');
    next();
  } else if (apiKey === config.keys.opencollective.apiKey) {
    debug(`Valid API key: ${apiKey}`);
    next();
  } else if (apiKey) {
    debug(`Invalid API key: ${apiKey}`);
    next(new Unauthorized(`Invalid API key: ${apiKey}`));
  } else {
    debug('Missing API key or Client Id');
    next();
  }
}

/**
 * Makes sure that the user the is logged in and req.remoteUser is populated.
 * if we cannot authenticate the user, we directly return an Unauthorized error.
 */
export function mustBeLoggedIn(req, res, next) {
  authenticateUser(req, res, e => {
    if (e) {
      return next(e);
    }
    if (!req.remoteUser) {
      return next(new Unauthorized('User is not authenticated'));
    } else {
      return next();
    }
  });
}
