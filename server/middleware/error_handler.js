const _ = require('lodash');
const curlify = require('request-as-curl');
const errors = require('../lib/errors');
const config = require('config');


const sendErrorByEmail = (req, err) => {
  var errorHTML = 'To reproduce this error, run this CURL command:<br />\n<br />\n';

  if (req.body.password)
    req.body.password = '***********';

  errorHTML += curlify(req, req.body);
  errorHTML += "<br />\n<br />\n";
  errorHTML += "Error: <br />\n";
  errorHTML += JSON.stringify(err);

  req.app.mailgun.sendMail({
    from: config.email.from,
    to: 'server-errors@opencollective.com',
    subject: `[${req.app.set('env')}] Error ${err.code}: ${req.method} ${req.url}`,
    html: errorHTML
  })
  .catch(console.error);
};

/**
 * error handler of the api
 */
module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const name = err.name;

  if (name === 'UnauthorizedError') {// because of jwt-express
    err.code = err.status;
  }

  res.header('Cache-Control', 'no-cache');

  // Validation error.
  const e = name && name.toLowerCase ? name.toLowerCase() : '';

  if (e.indexOf('validation') !== -1) {
    err = new errors.ValidationFailed(null, _.map(err.errors, (e) => e.path), err.message);
  } else if (e.indexOf('uniqueconstraint') !== -1) {
    err = new errors.ValidationFailed(null, _.map(err.errors, (e) => e.path), 'Unique Constraint Error.');
  }

  if (!err.code || !Number.isInteger(err.code)) {
    const code = (err.type && err.type.indexOf('Stripe') > -1) ? 400 : 500;
    err.code = err.status || code;
  }

  if (req.app.set('env') === 'production') {
    sendErrorByEmail(req, err);
  }

  console.error('Error Express : ', err);
  if (err.stack) console.log(err.stack);

  res.status(err.code).send({error: err});
};
