const errors = require('../lib/errors');

/**
 *  Parameters optionally for a route.
 */
module.exports = function(param, value) {

  return function (req, res, next) {
    // if param doesn't exist, go to next route
    if (!(req.query[param]) &&
      !(req.headers[param]) &&
      !(req.body[param])) {
      next('route');
    } else if ((req.query[param] === value) ||
      (req.headers[param] === value) ||
      (req.body[param]) === value) {
      // if it exists and value is right, proceed
      next();
    } else {
      // this means it exists and the value was something else
      return next(new errors.ValidationFailed('bad_parameter_value', param));
    }
  };
};
