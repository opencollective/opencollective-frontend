const errors = require('../lib/errors');

/**
 *  Parameters required for a route.
 */
module.exports = function(properties) {
  properties = [].slice.call(arguments);

  return function (req, res, next) {
    const missing = {};
    req.required = {};

    properties.forEach((prop) => {
      var value = req.query[prop];
      if (!value && value !== false)
        value = req.headers[prop];
      if (!value && value !== false)
        value = req.body[prop];

      if ((!value || value === 'null') && value !== false) {
        missing[prop] = `Required field ${prop} missing`;
      } else {
        try { // Try to parse if JSON
          value = JSON.parse(value);
        } catch (e) {
        }

        req.required[prop] = value;
      }
    });

    if (Object.keys(missing).length) {
      return next(new errors.ValidationFailed('missing_required', missing));
    }

    next();
  };
};
