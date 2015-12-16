/**
 * Dependencies.
 */
var _ = require('lodash');
var async = require('async');
var config = require('config');
var moment = require('moment');
var utils = require('../lib/utils');
var uuid = require('node-uuid');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models');
  var Activity = models.Activity;
  var Card = models.Card;
  var User = models.User;
  var errors = app.errors;

  /**
   * Get Preapproval Details.
   */
  var getPreapprovalDetails = function(preapprovalKey, callback) {
    var payload = {
      requestEnvelope: {
        errorLanguage:  'en_US',
        detailLevel:    'ReturnAll'
      },
      preapprovalKey: preapprovalKey
    };
    app.paypalAdaptive.preapprovalDetails(payload, callback);
  };

  /**
   * Get preapproval details route
   */
  var getDetails = function(req, res, next) {
    var preapprovalKey = req.params.preapprovalkey;

    getPreapprovalDetails(preapprovalKey, function(err, response) {
      if (err) return next(err);
      res.json(response);
    });
  };

  /**
   * Get a preapproval key for a user.
   */
  var getPreapprovalKey = function(req, res, next) {
    var uri = '/users/' + req.remoteUser.id + '/preapproval/paykey/${preapprovalKey}';
    var baseUrl = config.host.webapp + uri;
    var cancelUrl = req.query.cancelUrl || (baseUrl + '/cancel');
    var returnUrl = req.query.returnUrl || (baseUrl + '/success');
    var endingDate = (req.query.endingDate && (new Date(req.query.endingDate)).toISOString()) || moment().add(1, 'years').toISOString();
    var maxTotalAmountOfAllPayments = req.query.maxTotalAmountOfAllPayments || 2000; // 2000 is the maximum: https://developer.paypal.com/docs/classic/api/adaptive-payments/Preapproval_API_Operation/

    async.auto({

      getExistingCard: [function(cb) {
        Card
          .findAndCountAll({
            where: {
              service: 'paypal',
              UserId: req.remoteUser.id
            }
          })
          .done(cb);
      }],

      checkExistingCard: ['getExistingCard', function(cb, results) {
        async.each(results.getExistingCard.rows, function(card, cbEach) {
          if (!card.token) {
            return card.destroy().done(cbEach);
          }

          getPreapprovalDetails(card.token, function(err, response) {
            if (err) return cbEach(err);
            if (response.approved === 'false' || new Date(response.endingDate) < new Date()) {
              card.destroy().done(cbEach);
            } else {
              cbEach();
            }
          });
        }, cb);
      }],

      createCardEntry: ['checkExistingCard', function(cb, results) {
        Card.create({
          service: 'paypal',
          UserId: req.remoteUser.id
        }).done(cb);
      }],

      createPayload: ['createCardEntry', function(cb, results) {
        var payload = {
          currencyCode: 'USD',
          startingDate: new Date().toISOString(),
          endingDate: endingDate,
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
          displayMaxTotalAmount: true,
          feesPayer: 'SENDER',
          maxTotalAmountOfAllPayments: maxTotalAmountOfAllPayments,
          requestEnvelope: {
            errorLanguage:  'en_US'
          },
          clientDetails: results.createCardEntry.id
        };
        return cb(null, payload);
      }],

      callPaypal: ['createPayload', function(cb, results) {
        app.paypalAdaptive.preapproval(results.createPayload, cb);
      }],

      updateCardEntry: ['createCardEntry', 'createPayload', 'callPaypal', function(cb, results) {
        var card = results.createCardEntry;
        card.token = results.callPaypal.preapprovalKey;
        card.save().done(cb);
      }]

    }, function(err, results) {
      if (err) return next(err);
      var response = results.callPaypal;
      res.json(response);
    });

  };

  /**
   * Confirm a preapproval.
   */
  var confirmPreapproval = function(req, res, next) {

    async.auto({

      getCard: [function(cb) {
        Card
          .findAndCountAll({
            where: {
              service: 'paypal',
              UserId: req.remoteUser.id,
              token: req.params.preapprovalkey
            }
          })
          .done(cb);
      }],

      checkCard: ['getCard', function(cb, results) {
        if (results.getCard.rows.length === 0) {
          return cb(new errors.NotFound('This preapprovalKey doesn not exist.'));
        } else {
          cb();
        }
      }],

      callPaypal: [function(cb) {
        getPreapprovalDetails(req.params.preapprovalkey, function(err, response) {
          if (err) {
            return cb(err);
          }

          if (response.approved === 'false') {
            return cb(new errors.BadRequest('This preapprovalkey is not approved yet.'));
          }

          cb(null, response);
        });
      }],

      updateCard: ['callPaypal', 'getCard', 'checkCard', function(cb, results) {
        var card = results.getCard.rows[0];
        card.confirmedAt = new Date();
        card.data = results.callPaypal;
        card.save().done(cb);
      }],

      cleanOldCards: ['updateCard', function(cb) {
        Card
          .findAndCountAll({
            where: {
              service: 'paypal',
              UserId: req.remoteUser.id,
              token: {$ne: req.params.preapprovalkey}
            }
          })
          .then(function(results) {
            async.each(results.rows, function(card, cbEach) {
              card.destroy().done(cbEach);
            }, cb);
          })
          .catch(cb);
      }],

      createActivity: ['updateCard', function(cb, results) {
        Activity.create({
          type: 'user.card.created',
          UserId: req.remoteUser.id,
          data: {
            user: req.remoteUser,
            card: results.updateCard
          }
        }).done(cb);
      }]

    }, function(err, results) {
      if (err) return next(err);
      else res.json(results.updateCard.info);
    });

  };

  /**
   * Public methods.
   */
  return {
    getPreapprovalKey: getPreapprovalKey,
    confirmPreapproval: confirmPreapproval,
    getDetails: getDetails
  };

};
