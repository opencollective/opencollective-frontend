import config from 'config';
import errors from '../lib/errors';
import jwt from 'jsonwebtoken';

const { secret } = config.keys.opencollective;

/**
 * Express-jwt will either force all routes to have auth and throw
 * errors for public routes. Or authorize all the routes and not throw
 * expirations errors. This is a cleaned up version of that code that only
 * decodes the token (expected behaviour).
 */
export default (req, res, next) => {
  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');

    const scheme = parts[0];
    const token = parts[1];

    if (!/^Bearer$/i.test(scheme) || !token) {
      return next(new errors.Unauthorized('Format is Authorization: Bearer [token]'));
    }

    jwt.verify(token, secret, (err, decoded) => {
      // JWT library either returns an error or the decoded version
      if (err && err.name === 'TokenExpiredError') {
        req.jwtExpired = true;
        req.jwtPayload = jwt.decode(token, secret); // we need to decode again
      } else if (err) {
        return next(new errors.Unauthorized(err.message));
      } else {
        req.jwtPayload = decoded;
      }

      return next();
    });
  } else {
    return next();
  }

};
