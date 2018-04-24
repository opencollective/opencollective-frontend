import _ from 'lodash';
import curlify from 'request-as-curl';
import errors from '../lib/errors';
import emailLib from '../lib/email';


const sendErrorByEmail = (req, err) => {
  let errorHTML = 'To reproduce this error, run this CURL command:<br />\n<br />\n';

  if (req.body.password)
    req.body.password = '***********';

  if (req.body.passwordConfirmation)
    req.body.passwordConfirmation = '***********';

  errorHTML += curlify(req, req.body);
  errorHTML += "<br />\n<br />\n";
  errorHTML += "Error: <br />\n";
  errorHTML += JSON.stringify(err);

  emailLib.sendMessage(
    'server-errors@opencollective.com',
    `[${req.app.set('env')}] Error ${err.code}: ${req.method} ${req.url}`,
    errorHTML,
    {bcc: ' '})
  .catch(console.error);
};

/**
 * error handler of the api
 */
export default (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const { name } = err;

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

  // only send email for important errors. When someone gets wrong jwt token or api key, it shouldn't spam us.
  if (req.app.set('env') === 'production' &&
    !(err.code === 400 && req.method === 'GET') &&
    !(err.code === 404 && req.method === 'GET')) {
    sendErrorByEmail(req, err);
  }

  console.error('Error Express : ', err);
  if (err.stack) console.log(err.stack);

  res.status(err.code).send({error: err});
};
