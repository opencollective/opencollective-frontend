/**
 * Dependencies.
 */

var async = require('async');
var axios = require('axios');
var _ = require('lodash');
var qs = require('querystring');
var config = require('config');

/**
 * Controller.
 */

module.exports = function(app) {

  /**
   * Internal Dependencies.
   */

  var errors = app.errors;
  var models = app.set('models');

  var TOKEN_URI = 'https://connect.stripe.com/oauth/token';
  var AUTHORIZE_URI = 'https://connect.stripe.com/oauth/authorize';

  /**
   * Ask stripe for authorization OAuth
   */

  var authorize = function(req, res, next) {

    if (!req.group.isHost) {
      return next(new errors.BadRequest('Group is not a host.'));
    }

    var params = qs.stringify({
      response_type: 'code',
      scope: 'read_write',
      client_id: config.stripe.clientId,
      redirect_uri: config.stripe.redirectUri,
      state: req.group.id
    });

    res.redirect(AUTHORIZE_URI + '?' + params);
  };

  /**
   * Callback for the stripe OAuth
   */

  var callback = function(req, res, next) {
    var code = req.query.code;
    var groupid = req.query.state;

    if (!groupid) {
      return next(new errors.BadRequest('No state in the callback'));
    }

    async.auto({

      findGroup: function(cb) {
        models.Group.find(groupid)
          .done(cb);
      },

      getToken: ['findGroup', function(cb, results) {
        if (!results.findGroup) {
          return next(new errors.BadRequest('Group does not exist'));
        }

        axios
          .post(TOKEN_URI, {
            grant_type: 'authorization_code',
            client_id: config.stripe.clientId,
            code: code,
            client_secret: config.stripe.secret
          })
          .then(function(response) {
            cb(null, response.data)
          })
          .catch(next);
      }],

      createStripeAccount: ['getToken', function(cb, results) {
        var data = results.getToken;

        models.StripeAccount.create({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          tokenType: data.token_type,
          stripePublishableKey: data.stripe_publishable_key,
          stripeUserId: data.stripe_user_id,
          scope: data.scope
        }).done(cb);
      }],

      saveStripeCredentials: ['findGroup', 'createStripeAccount', function(cb, results) {
        var group = results.findGroup;

        group.setStripeAccount(results.createStripeAccount)
        .done(cb);
      }]

    }, function(err, results) {
      if (err) return next(err);

      res.send({ success: true });
    });
  };

  return {
    authorize: authorize,
    callback: callback
  };

};
