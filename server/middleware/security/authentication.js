import debug from 'debug';
import config from 'config';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import request from 'request-promise';
import { get, omitBy, isNil } from 'lodash';
import { URLSearchParams } from 'url';

import models from '../../models';
import errors from '../../lib/errors';
import paymentProviders from '../../paymentProviders';
import { createOrUpdate as createOrUpdateConnectedAccount } from '../../controllers/connectedAccounts';

const { User } = models;

const { BadRequest, CustomError } = errors;

const { jwtSecret } = config.keys.opencollective;

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

  jwt.verify(token, jwtSecret, (err, decoded) => {
    // JWT library either returns an error or the decoded version
    if (err && err.name === 'TokenExpiredError') {
      req.jwtExpired = true;
      req.jwtPayload = jwt.decode(token, jwtSecret); // we need to decode again
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

/**
 * Authenticate the user using the JWT token and populates:
 *  - req.remoteUser
 *  - req.remoteUser.memberships[CollectiveId] = [roles]
 */
export const _authenticateUserByJwt = (req, res, next) => {
  if (!req.jwtPayload) return next();
  const userid = Number(req.jwtPayload.sub);
  User.findByPk(userid)
    .then(user => {
      if (!user) throw errors.Unauthorized(`User id ${userid} not found`);
      user.update({ seenAt: new Date() });
      req.remoteUser = user;
      return user.populateRoles();
    })
    .then(() => {
      debug('auth')('logged in user', req.remoteUser.id, 'roles:', req.remoteUser.rolesByCollectiveId);

      // Populates req.remoteUser.canEditCurrentCollective, used for GraphQL to keep track whether the remoteUser can see members' details
      const CollectiveId = get(req, 'body.variables.collective.id') || req.params.collectiveid;
      req.remoteUser.canEditCurrentCollective = CollectiveId && req.remoteUser.isAdmin(CollectiveId);
      debug('auth')('Can edit current collective', CollectiveId, '?', req.remoteUser.canEditCollective);
      next();
      return null;
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

  parseJwtNoExpiryCheck(req, res, e => {
    // If a token was submitted but is invalid, we continue without authenticating the user
    if (e) {
      debug('auth')('>>> checkJwtExpiry invalid error', e);
      return next();
    }

    checkJwtExpiry(req, res, e => {
      // If a token was submitted and is expired, we continue without authenticating the user
      if (e) {
        debug('auth')('>>> checkJwtExpiry expiry error', e);
        return next();
      }
      _authenticateUserByJwt(req, res, next);
    });
  });
}

export const authenticateService = (req, res, next) => {
  const { service } = req.params;
  const opts = { callbackURL: getOAuthCallbackUrl(req) };

  if (service === 'github') {
    /*
      'repo' gives us access to org repos and private repos (latter is an issue for some people)
      'public_repo' should give us all public_repos but in some cases users report not
        being able to see their repos.

      We have fluctuated back and forth. With the new simplified GitHub signup flow,
      it's possible that 'public_repo' is enough.

      Update: removing public_repo as well, since technically we shouldn't need it.
    */

    opts.scope = ['user:email', 'public_repo', 'read:org'];
    return passport.authenticate(service, opts)(req, res, next);
  }

  if (!req.remoteUser || !req.remoteUser.isAdmin(req.query.CollectiveId)) {
    throw new errors.Unauthorized('Please login as an admin of this collective to add a connected account');
  }

  if (!req.query.CollectiveId) {
    return next(new errors.ValidationFailed('Please provide a CollectiveId as a query parameter'));
  }

  if (paymentProviders[service]) {
    return paymentProviders[service].oauth
      .redirectUrl(req.remoteUser, req.query.CollectiveId, req.query)
      .then(redirectUrl => res.send({ redirectUrl }))
      .catch(next);
  }

  if (service === 'meetup') {
    opts.scope = 'ageless';
  }

  return passport.authenticate(service, opts)(req, res, next);
};

export const authenticateServiceCallback = (req, res, next) => {
  const { service } = req.params;

  if (get(paymentProviders, `${service}.oauth.callback`)) {
    return paymentProviders[service].oauth.callback(req, res, next);
  }

  const opts = { callbackURL: getOAuthCallbackUrl(req) };

  passport.authenticate(service, opts, async (err, accessToken, data) => {
    if (err) {
      return next(err);
    }
    if (!accessToken) {
      return res.redirect(config.host.website);
    }
    let emails;
    if (service === 'github' && !req.remoteUser) {
      emails = await getGithubEmails(accessToken);
    }
    createOrUpdateConnectedAccount(req, res, next, accessToken, data, emails).catch(next);
  })(req, res, next);
};

function getOAuthCallbackUrl(req) {
  const { utm_source, CollectiveId, access_token, redirect } = req.query;
  const { service } = req.params;

  const params = new URLSearchParams(omitBy({ access_token, redirect, CollectiveId, utm_source }, isNil));

  return `${config.host.website}/api/connected-accounts/${service}/callback?${params.toString()}`;
}

function getGithubEmails(accessToken) {
  return request({
    uri: 'https://api.github.com/user/emails',
    qs: { access_token: accessToken },
    headers: { 'User-Agent': 'OpenCollective' },
    json: true,
  }).then(json => json.map(entry => entry.email));
}
