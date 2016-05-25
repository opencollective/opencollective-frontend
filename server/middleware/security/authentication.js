var config = require('config');
var jwt = require('jsonwebtoken');
const passport = require('passport');
const request = require('request-promise');

var errors = require('../../lib/errors');
var required = require('../required_param');

const Forbidden = errors.Forbidden;
const Unauthorized = errors.Unauthorized;
const secret = config.keys.opencollective.secret;

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
module.exports = function (app) {

  var models = app.get('models');
  var controllers = app.get('controllers');
  var connectedAccounts = controllers.connectedAccounts;
  var Application = models.Application;
  var User = models.User;

  return {

    /**
     * Express-jwt will either force all routes to have auth and throw
     * errors for public routes. Or authorize all the routes and not throw
     * expirations errors. This is a cleaned up version of that code that only
     * decodes the token (expected behaviour).
     */
    parseJwtNoExpiryCheck: (req, res, next) => {
      if (!req.headers || !req.headers.authorization) {
        return next(new Unauthorized('Missing authorization header'));
      }
      const parts = req.headers.authorization.split(' ');

      const scheme = parts[0];
      const token = parts[1];

      if (!/^Bearer$/i.test(scheme) || !token) {
        return next(new Unauthorized('Format is Authorization: Bearer [token]'));
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
    },

    checkJwtExpiry: (req, res, next) => {
      if (req.jwtExpired) {
        return next(new errors.CustomError(401, 'jwt_expired', 'jwt expired'));
      }

      return next();
    },

    _authenticateAppByJwt: (req, res, next) => {
      const appId = parseInt(req.jwtPayload.aud);

      Application
        .find(appId)
        .tap(application => {
          if (application.disabled) {
            throw new Unauthorized();
          }
          req.application = application;
          return next();
        })
        .catch(next);
    },

    authenticateAppByJwt() {
      return (req, res, next) => {
        this.parseJwtNoExpiryCheck(req, res, (e) => {
          if (e) {
            return next(e);
          }
          this._authenticateAppByJwt(req, res, next);
        });
      }
    },

    authenticateAppByApiKey: (req, res, next) => {
      required('api_key')(req, res, (e) => {
        if (e) return next(e);
        findApplicationByKey(req.required.api_key, req, next);
      });
    },

    authenticateApp() {
      return (req, res, next) => {
        this.authenticateAppByApiKey(req, res, (e) => {
          if (e) {
            this.authenticateAppByJwt()(req, res, next);
          }
          next();
        });
      }
    },

    authenticateUserAndAppByJwtNoExpiry() {
      return [
        this.parseJwtNoExpiryCheck,
        this._authenticateAppByJwt,
        this._authenticateUserByJwt
      ]
    },

    authenticateUserAndAppByJwt() {
      return (req, res, next) => {
        this.authenticateUserByJwt()(req, res, (e) => {
          if (e) {
            return next(e);
          }
          this._authenticateAppByJwt(req, res, next);
        });
      };
    },

    /**
     * Authenticate user by username/email/password.
     */
    authenticateUserByPassword: (req, res, next) => {
      required('password')(req, res, (e) => {
        if (e) {
          return next(e);
        }

        const username = (req.body && req.body.username) || req.query.username;
        const email = (req.body && req.body.email) || req.query.email;
        const password = (req.body && req.body.password) || req.query.password;

        User
          .auth((username || email), password, (e, user) => {
            var errorMsg = 'Invalid username/email or password';

            if (e) {
              if (e.code === 400) {
                return next(new errors.BadRequest(errorMsg));
              }
              else {
                return next(new errors.ServerError(e.message));
              }
            }

            if (!user) {
              return next(new errors.BadRequest(errorMsg));
            }

            req.remoteUser = user;
            req.user = req.remoteUser;

            next();
          });
      });
    },

    _authenticateUserByJwt: (req, res, next) => {
      User
        .find(req.jwtPayload.sub)
        .tap(user => {
          req.remoteUser = user;
          next();
        })
        .catch(next);
    },

    authenticateUserByJwt() {
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
    },

    authenticateUserOrApp() {
      return (req, res, next) => {
        this.authenticateUserAndAppByJwt()(req, res, (e) => {
          if (!e) {
            return next();
          }
          this.authenticateAppByApiKey(req, res, next);
        });
      };
    },

    authenticateAppByEncryptedApiKey: (req, res, next) => {
      required('api_key_enc')(req, res, (e) => {
        if (e) return next(e);
        const apiKeyEnc = req.required.api_key_enc;
        jwt.verify(apiKeyEnc, secret, (err, decoded) => {
          if (err) {
            return next(new Unauthorized(err.message));
          }
          findApplicationByKey(decoded.apiKey, req, next);
        });
      });
    },

    authenticateService: (req, res, next) => {
      const apiKey = req.required.api_key;
      const apiKeyEnc = jwt.sign({apiKey}, secret, { expiresIn: '1min' });
      const service = req.params.service;
      passport.authenticate(service, {
        callbackURL: `${config.host.api}/connected-accounts/${service}/callback?api_key_enc=${apiKeyEnc}`,
        scope: [ 'user:email', 'public_repo' ]
      })(req, res, next);
    },

    authenticateServiceCallback: (req, res, next) => {
      const service = req.params.service;
      passport.authenticate(service, (err, accessToken, profile) => {
        if (err) {
          return next(err);
        }
        if (!accessToken) {
          return res.redirect(config.host.website);
        }
        request({
          uri: 'https://api.github.com/user/emails',
          qs: { access_token: accessToken },
          headers: { 'User-Agent': 'OpenCollective' },
          json: true
        })
          .then(json => json.map(entry => entry.email))
          .then(emails => connectedAccounts.createOrUpdate(req, res, next, accessToken, profile, emails))
          .catch(next);
      })(req, res, next);
    }
  };

  function findApplicationByKey(api_key, req, next) {
    Application.findOne({ where: { api_key }})
      .tap(application => {
        if (!application) {
          return next(new Unauthorized(`Invalid API key: ${api_key}`));
        }
        if (application.disabled) {
          return next(new Forbidden('Application disabled'));
        }
        req.application = application;
        next();
      })
      .catch(next);
  }
};
