/**
 * Dependencies.
 */
var axios = require('axios');
var qs = require('querystring');
var config = require('config');

var roles = require('../constants/roles');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */

  const errors = app.errors;
  const models = app.get('models');

  const AUTHORIZE_URI = 'https://connect.stripe.com/oauth/authorize';
  const TOKEN_URI = 'https://connect.stripe.com/oauth/token';

  const checkIfUserIsHost = UserId =>
    models.UserGroup.find({
      where: {
        UserId: UserId,
        role: roles.HOST
      }
    })
    .then(userGroup => {
      if (!userGroup) throw new errors.BadRequest(`User ${UserId} is not a host`);
    });

  const getToken = code => () => axios
    .post(TOKEN_URI, {
      grant_type: 'authorization_code',
      client_id: config.stripe.clientId,
      client_secret: config.stripe.secret,
      code
    })
    .then(res => res.data);

  const createStripeAccount = data => models.StripeAccount.create({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
    stripePublishableKey: data.stripe_publishable_key,
    stripeUserId: data.stripe_user_id,
    scope: data.scope
  });

  /**
   * Ask stripe for authorization OAuth
   */
  const authorize = (req, res, next) => {
    checkIfUserIsHost(req.remoteUser.id)
      .then(() => {
        var params = qs.stringify({
          response_type: 'code',
          scope: 'read_write',
          client_id: config.stripe.clientId,
          redirect_uri: config.stripe.redirectUri,
          state: req.remoteUser.id
        });

        res.send({
          redirectUrl: `${AUTHORIZE_URI}?${params}`
        });
      })
      .catch(next);
  };

  /**
   * Callback for the stripe OAuth
   */
  const callback = (req, res, next) => {
    var UserId = req.query.state;

    if (!UserId) {
      return next(new errors.BadRequest('No state in the callback'));
    }

    var host;
    checkIfUserIsHost(UserId)
      .then(() => models.User.find(UserId))
      .tap(h => host = h)
      .then(getToken(req.query.code))
      .then(createStripeAccount)
      .then(stripeAccount => host.setStripeAccount(stripeAccount))
      .then(() => res.redirect(`${config.host.webapp}/?stripeStatus=success`))
      .catch(next);
  };

  return {
    authorize,
    callback
  };
};
