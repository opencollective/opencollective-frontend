import _ from 'lodash';
import config from 'config';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import request from 'request-promise';
import qs from 'querystring';

import {createOrUpdate as createOrUpdateConnectedAccount} from '../../controllers/connectedAccounts';
import models from '../../models';
import errors from '../../lib/errors';
import debug from 'debug';
import * as stripe from '../../controllers/stripe';

const {
  User
} = models;

const {
  BadRequest,
  CustomError,
  Unauthorized
} = errors;

const { secret } = config.keys.opencollective;

/**
 * Middleware related to authentication.
 *
 * Identification is provided through two vectors:
 * - api_key URL parameter which uniquely identifies an application
 * - JSON web token JWT payload which contains 3 items:
 *   - sub: user ID
 *   - scope: user scope (e.g. 'subscriptions')
 *
 * Thus:
 * - a user is identified with a JWT
 */

/**
 * Express-jwt will either force all routes to have auth and throw
 * errors for public routes. Or authorize all the routes and not throw
 * expirations errors. This is a cleaned up version of that code that only
 * decodes the token (expected behaviour).
 */
export const parseJwtNoExpiryCheck = (req, res, next) => {
  let token = req.params.access_token || req.query.access_token || req.body.access_token;
  if (!token) {
    const header = req.headers && req.headers.authorization;
    if (!header) return next();

    const parts = header.split(' ');
    const scheme = parts[0];
    token = parts[1];

    if (!/^Bearer$/i.test(scheme) || !token) {
      return next(new BadRequest('Format is Authorization: Bearer [token]'));
    }
  }

  jwt.verify(token, secret, (err, decoded) => {
    // JWT library either returns an error or the decoded version
    if (err && err.name === 'TokenExpiredError') {
      req.jwtExpired = true;
      req.jwtPayload = jwt.decode(token, secret); // we need to decode again
    } else if (err) {
      return next(new BadRequest(err.message));
    } else {
      req.jwtPayload = decoded;
    }

    return next();
  });
};

export const checkJwtExpiry = (req, res, next) => {
  if (req.jwtExpired) {
    return next(new CustomError(401, 'jwt_expired', 'jwt expired'));
  }

  return next();
};


export function authenticateUserByJwtNoExpiry() {
  return [
    this.parseJwtNoExpiryCheck,
    this._authenticateUserByJwt
  ]
}

export const _authenticateUserByJwt = (req, res, next) => {
  if (!req.jwtPayload) return next();
  const userid = req.jwtPayload.sub;
  User
    .findById(userid)
    .then(user => {
      if (!user) throw errors.Unauthorized(`User id ${userid} not found`);
      user.update({ seenAt: new Date() });
      req.remoteUser = user;
      debug('auth')('logged in user', req.remoteUser.id);
      if (req.body && req.body.variables && req.body.variables.collective) {
        return req.remoteUser.canEditCollective(req.body.variables.collective.id).then(canEditCollective => {
          req.remoteUser.canEditCollective = canEditCollective;
          debug('auth')('Can edit collective', req.body.variables.collective.id, '?', canEditCollective);
          next();
        })
      } else {
        next();
      }
    })
    .catch(next);
};

/**
 * Authenticate the user with the JWT token if any, otherwise continues
 * 
 * @PRE: Request with a `Authorization: Bearer [token]` with a valid token
 * @POST: req.remoteUser is set to the logged in user or null if authentication failed
 * @ERROR: Will return an error if a JWT token is provided and invalid
 */
export function authenticateUser(req, res, next) {
  if (req.remoteUser && req.remoteUser.id) return next();

  parseJwtNoExpiryCheck(req, res, (e) => {
    // If a token was submitted but is invalid, we return an error
    if (e) return next(e);

    checkJwtExpiry(req, res, (e) => {
      // If a token was submitted and is expired, we return an error
      if (e) return next(e);
      _authenticateUserByJwt(req, res, next);
    });

  });
}

export function authenticateInternalUserByJwt() {
  return (req, res, next) => {
    parseJwtNoExpiryCheck(req, res, (e) => {
      if (e) {
        return next(e);
      }
      checkJwtExpiry(req, res, (e) => {
        if (e) {
          return next(e);
        }
        _authenticateUserByJwt(req, res, (e) => {
          if (e) {
            return next(e);
          }
          _authenticateInternalUserById(req, res, next);
        });
      });
    });
  }
}

export const _authenticateInternalUserById = (req, res, next) => {
  if (req.jwtPayload && _.contains([1,2,4,5,6,7,8,30,40,212,772], req.jwtPayload.sub)) {
    next();
  } else {
    throw new Unauthorized();
  }
}

export const authenticateService = (req, res, next) => {
  const opts = { callbackURL: getOAuthCallbackUrl(req) };

  const { service } = req.params;

  if ( service === 'stripe') {
    return stripe.authorize(req, res, next);
  }

  switch (service) {
    case 'github':
      // 'repo' gives us access to organizational repositories as well
      // vs. 'public_repo' which requires the org to give separate access to app
      opts.scope = [ 'user:email', 'repo' ]; 
      break;
    case 'meetup':
      opts.scope = 'ageless';
      break;
  }

  console.log("authenticateService calling Passport with options", opts);
  passport.authenticate(service, opts)(req, res, next);
};

export const authenticateServiceCallback = (req, res, next) => {
  const { service } = req.params;

  if (service === 'stripe') {
    return stripe.callback(req, res, next);
  }

  const opts = { callbackURL: getOAuthCallbackUrl(req) };
  console.log("authenticateServiceCallback calling Passport with options", opts);
  passport.authenticate(service, opts, (err, accessToken, data) => {
    if (err) {
      return next(err);
    }
    if (!accessToken) {
      return res.redirect(config.host.website);
    }
    if (service === 'github') {
      request({
        uri: 'https://api.github.com/user/emails',
        qs: { access_token: accessToken },
        headers: { 'User-Agent': 'OpenCollective' },
        json: true
      })
        .then(json => json.map(entry => entry.email))
        .then(emails => createOrUpdateConnectedAccount(req, res, next, accessToken, data, emails))
        .catch(next);
    } else {
      createOrUpdateConnectedAccount(req, res, next, accessToken, data);
    }
  })(req, res, next);
};

function getOAuthCallbackUrl(req) {
  const { utm_source } = req.query;
  const { CollectiveId } = req.query;
  const params = qs.stringify({ utm_source, CollectiveId });
  const { service } = req.params;
  return `${config.host.website}/api/connected-accounts/${service}/callback?${params}`;
}
