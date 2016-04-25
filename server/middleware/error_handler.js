const _ = require('lodash');

const errors = require('../lib/errors');

/**
 * error handler of the api
 */

module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  var name = err.name;

  if (name === 'UnauthorizedError') {// because of jwt-express
    err.code = err.status;
  }

  res.header('Cache-Control', 'no-cache');

  // Validation error.
  var e = name && name.toLowerCase ? name.toLowerCase() : '';

  if (e.indexOf('validation') !== -1) {
    err = new errors.ValidationFailed(null, _.map(err.errors, (e) => e.path), err.message);
  } else if (e.indexOf('uniqueconstraint') !== -1) {
    err = new errors.ValidationFailed(null, _.map(err.errors, (e) => e.path), 'Unique Constraint Error.');
  }

  if (!err.code) {
    var code = (err.type && err.type.indexOf('Stripe') > -1) ? 400 : 500;
    err.code = err.status || code;
  }

  console.error('Error Express : ', err);
  if (err.stack) console.log(err.stack);

  res.status(err.code).send({error: err});
};