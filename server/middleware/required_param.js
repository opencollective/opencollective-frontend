import errors from '../lib/errors';

/**
 *  Parameters required for a route.
 */
export default function(properties) {
  properties = [].slice.call(arguments);

  return function (req, res, next) {
    const missing = {};
    req.required = {};

    properties.forEach((prop) => {
      // A required value can be defined as a GET parameter
      let value = req.query[prop];

      // Or as a header
      if (!value && value !== false)
        value = req.headers[prop];

      // Or as a POST parameter
      if (!value && value !== false)
        value = req.body[prop];

      // Or as a param in the route, e.g. :slug or :groupid
      if (!value && value !== false)
        value = req.params[prop];

      // Or it can have done prepopulated by a middleware before
      // e.g. we can require that req.remoteUser or that req.group has been populated
      if (!value && value !== false)
        value = req[prop];

      if ((!value || value === 'null') && value !== false) {
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
