import _ from 'lodash';
import config from 'config';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import request from 'request-promise';
import qs from 'querystring';

import {createOrUpdate as createOrUpdateConnectedAccount} from '../../controllers/connectedAccounts';
import models from '../../models';
import errors from '../../lib/errors';
import required from '../required_param';

const {
  Application,
  User
} = models;

const {
  BadRequest,
  CustomError,
  Forbidden,
  ServerError,
  Unauthorized
} = errors;

const { secret } = config.keys.opencollective;

/**
 * Middleware related to authentication.
 *
 * Identification is provided through two vectors:
 * - api_key URL parameter which uniquely identifies an application
 * - JSON web token JWT payload which contains 3 items:
 *   - aud: application ID which also uniquely identifies an application
 *   - sub: user ID
 *   - scope: user scope (e.g. 'subscriptions')
 *
 * Thus:
 * - an application is identified with either an api_key or a JWT
 * - a user is identified with a JWT
 */

/**
 * Express-jwt will either force all routes to have auth and throw
 * errors for public routes. Or authorize all the routes and not throw
 * expirations errors. This is a cleaned up version of that code that only
 * decodes the token (expected behaviour).
 */
export const parseJwtNoExpiryCheck = (req, res, next) => {
  let token;
  if (req.params.access_token) {
    token = req.params.access_token;
  } else {
    const header = req.headers && req.headers.authorization;
    if (!header) {
      return next(new Unauthorized('Missing authorization header'));
    }
    const parts = header.split(' ');
    const scheme = parts[0];
    token = parts[1];

    if (!/^Bearer$/i.test(scheme) || !token) {
      return next(new Unauthorized('Format is Authorization: Bearer [token]'));
    }
  }

  jwt.verify(token, secret, (err, decoded) => {
    // JWT library either returns an error or the decoded version
    if (err && err.name === 'TokenExpiredError') {
      req.jwtExpired = true;
      req.jwtPayload = jwt.decode(token, secret); // we need to decode again
    } else if (err) {
      return next(new Unauthorized(err.message));
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

export const _authenticateAppByJwt = (req, res, next) => {
  const appId = parseInt(req.jwtPayload.aud);

  Application
    .findById(appId)
    .tap(application => {
      if (application.disabled) {
        throw new Unauthorized();
      }
      req.application = application;
      return next();
    })
    .catch(next);
};

export function authenticateAppByJwt() {
  return (req, res, next) => {
    this.parseJwtNoExpiryCheck(req, res, (e) => {
      if (e) {
        return next(e);
      }
      this._authenticateAppByJwt(req, res, next);
    });
  }
}

export const authenticateAppByApiKey = (req, res, next) => {
  required('api_key')(req, res, (e) => {
    if (e) return next(e);
    findApplicationByKey(req.required.api_key)
      .then(application => req.application = application)
      .then(() => next())
      .catch(next);
  });
};

export function authenticateApp() {
  return (req, res, next) => {
    this.authenticateAppByApiKey(req, res, (e) => {
      if (e) {
        this.authenticateAppByJwt()(req, res, next);
      }
      next();
    });
  }
}

export function authenticateUserAndAppByJwtNoExpiry() {
  return [
    this.parseJwtNoExpiryCheck,
    this._authenticateAppByJwt,
    this._authenticateUserByJwt
  ]
}

export function authenticateUserAndAppByJwt() {
  return (req, res, next) => {
    this.authenticateUserByJwt()(req, res, (e) => {
      if (e) {
        return next(e);
      }
      this._authenticateAppByJwt(req, res, next);
    });
  };
}

/**
 * Authenticate user by username/email/password.
 */
export const authenticateUserByPassword = (req, res, next) => {
  required('password')(req, res, (e) => {
    if (e) {
      return next(e);
    }

    const username = (req.body && req.body.username) || req.query.username;
    const email = (req.body && req.body.email) || req.query.email;
    const password = (req.body && req.body.password) || req.query.password;

    User
      .auth((username || email), password, (e, user) => {
        const errorMsg = 'Invalid username/email or password';

        if (e) {
          if (e.code === 400) {
            return next(new BadRequest(errorMsg));
          } else {
            return next(new ServerError(e.message));
          }
        }

        if (!user) {
          return next(new BadRequest(errorMsg));
        }

        req.remoteUser = user;
        req.user = req.remoteUser;

        next();
      });
  });
};

export const _authenticateUserByJwt = (req, res, next) => {
  User
    .findById(req.jwtPayload.sub)
    .tap(user => {
      req.remoteUser = user;
      next();
    })
    .catch(next);
};

/**
 * Authenticate the user with the JWT token 
 * 
 * @PRE: Request with a `Authorization: Bearer [token]` with a valid token
 * @POST: req.remoteUser is set to the logged in user or null if authentication failed
 */
export function authenticateUserByJwt() {
  return (req, res, next) => {
    this.parseJwtNoExpiryCheck(req, res, (e) => {
      if (e) {
        return next(e);
      }
      this.checkJwtExpiry(req, res, (e) => {
        if (e) {
          return next(e);
        }
        this._authenticateUserByJwt(req, res, next);
      });
    });
  }
}

export function authenticateInternalUserByJwt() {
  return (req, res, next) => {
    this.parseJwtNoExpiryCheck(req, res, (e) => {
      if (e) {
        return next(e);
      }
      this.checkJwtExpiry(req, res, (e) => {
        if (e) {
          return next(e);
        }
        this._authenticateUserByJwt(req, res, (e) => {
          if (e) {
            return next(e);
          }
          this._authenticateInternalUserById(req, res, next);
        });
      });
    });
  }
}

export const _authenticateInternalUserById = (req, res, next) => {
  if (_.contains([1,2,4,5,6,7,8,30,40,212,772], req.jwtPayload.sub)) {
    next();
  } else {
    throw new Unauthorized();
  }
}

export function authenticateUserOrApp() {
  return (req, res, next) => {
    this.authenticateUserAndAppByJwt()(req, res, (e) => {
      if (!e) {
        return next();
      }
      this.authenticateAppByApiKey(req, res, next);
    });
  };
}

export const authenticateService = (req, res, next) => {
  const opts = { callbackURL: getOAuthCallbackUrl(req) };

  const { service } = req.params;
  switch (service) {
    case 'github':
      opts.scope = [ 'user:email', 'public_repo' ];
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

function findApplicationByKey(api_key) {
  return Application.findOne({ where: { api_key }})
    .tap(application => {
      if (!application) {
        throw new Unauthorized(`Invalid API key: ${api_key}`);
      }
      if (application.disabled) {
        throw new Forbidden('Application disabled');
      }
    });
}

function getOAuthCallbackUrl(req) {
  const { utm_source } = req.query;
  const { slug } = req.query;
  const params = qs.stringify({ utm_source, slug });
  const { service } = req.params;
  return `${config.host.website}/api/connected-accounts/${service}/callback?${params}`;
}
