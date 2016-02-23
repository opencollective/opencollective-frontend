const config = require('config');
const Unauthorized = require('../lib/errors').Unauthorized;
const jwt = require('jsonwebtoken');

const secret = config.keys.opencollective.secret;

/**
 * Express-jwt will either force all routes to have auth and throw
 * errors for public routes. Or authorize all the routes and not throw
 * expirations errors. This is a cleaned up version of that code that only
 * decodes the token (expected behaviour).
 */
module.exports = (req, res, next) => {
  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');

    const scheme = parts[0];
    const token = parts[1];

    if (!/^Bearer$/i.test(scheme) || !token) {
      return next(new Unauthorized('Format is Authorization: Bearer [token]'));
    }

    jwt.verify(token, secret, (err, decoded) => {
      if (err) return next(new Unauthorized(err.message));

      req.jwtPayload = decoded;
      return next();
    });
  } else {
    return next();
  }

};