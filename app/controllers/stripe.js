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
  var sequelize = models.sequelize;
  var User = models.User;

  var TOKEN_URI = 'https://connect.stripe.com/oauth/token';
  var AUTHORIZE_URI = 'https://connect.stripe.com/oauth/authorize';

  var getAdmin = function(GroupId, cb) {

    var sql = 'SELECT * FROM "UserGroups" ' +
          'LEFT JOIN "Users" ' +
          'ON "UserId" = "id" ' +
          'WHERE "GroupId" = :GroupId ' +
          'AND "role" = :role';

    sequelize.query(sql, {
      replacements: {
        GroupId: GroupId,
        role: 'admin'
      },

      // we could pass the model but it only works with sequelize >= 3.0.0
      type: sequelize.QueryTypes.SELECT
    })
    .then(function(users) {
      if (!users || users.length === 0 || !_.isObject(users[0])) {
        return cb(new errors.BadRequest('This group has no admin'));
      }

      cb(null,  User.build(users[0], { isNewRecord: false }));
    })
    .catch(cb);
  };

  /**
   * Ask stripe for authorization OAuth
   */

  var authorize = function(req, res, next) {
    getAdmin(req.group.id, function(err, user) {
      if (err) return next(err);

      var params = qs.stringify({
        response_type: 'code',
        scope: 'read_write',
        client_id: config.stripe.clientId,
        redirect_uri: config.stripe.redirectUri,
        state: req.group.id
      });

      res.redirect(AUTHORIZE_URI + '?' + params);
    });
  };

  /**
   * Callback for the stripe OAuth
   */

  var callback = function(req, res, next) {
    var code = req.query.code;
    var GroupId = req.query.state;
    if (!GroupId) {
      return next(new errors.BadRequest('No state in the callback'));
    }

    async.auto({

      findAdmin: function(cb) {
        getAdmin(GroupId, function(err, user) {
          if (err) return cb(err);

          cb(null, user);
        });
      },

      getToken: ['findAdmin', function(cb, results) {
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
        })
        .done(cb);
      }],

      saveStripeCredentials: ['findAdmin', 'createStripeAccount', function(cb, results) {
        var admin = results.findAdmin;

        admin
          .setStripeAccount(results.createStripeAccount)
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
