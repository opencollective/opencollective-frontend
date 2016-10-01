import errors from '../lib/errors';

/**
 *  Parameters required for a route (POST, GET or headers params)
 */
export default function required(properties) {
  return _required_options({ include: ['query', 'body', 'headers']}, properties);
}

/**
 * Check that the middlewares have populated the needed values 
 * (such as `req.remoteUser` or `reg.group` or any other model)
 */
export function required_valid(properties) {
  return _required_options({ include: ['query', 'body', 'headers', '']}, properties);
}

function _required_options(options, properties) {
  properties = [].slice.call(arguments);
  properties.shift();

  return function (req, res, next) {
    const missing = {};
    req.required = {};

    properties.forEach((prop) => {
      let value;
      options.include.forEach(source => {
        if (value || value === false) return;
        value = (source) ? req[source][prop] : req[prop];
      });

      if ((!value || value === 'null') && value !== false) {
        if (prop === 'remoteUser') return next(new errors.Unauthorized("User is not authenticated"));
        missing[prop] = `Required field ${prop} missing`;
      } else {
        try { // Try to parse if JSON
          value = JSON.parse(value);
        } catch (e) {
          // ignore error: leave value as it is
        }

        req.required[prop] = value;
      }
    });

    if (Object.keys(missing).length) {
      return next(new errors.ValidationFailed('missing_required', missing));
    }

    next();
  };
}