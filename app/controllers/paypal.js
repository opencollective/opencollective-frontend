/**
 * Dependencies.
 */
var async = require('async');
var config = require('config');
var moment = require('moment');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models');
  var Activity = models.Activity;
  var PaymentMethod = models.PaymentMethod;
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
    // TODO: This return and cancel URL doesn't work - no routes right now.
    var uri = `/users/${req.remoteUser.id}/paypal/preapproval/`;
    var baseUrl = config.host.webapp + uri;
    var cancelUrl = req.query.cancelUrl || (baseUrl + '/cancel');
    var returnUrl = req.query.returnUrl || (baseUrl + '/success');
    var endingDate = (req.query.endingDate && (new Date(req.query.endingDate)).toISOString()) || moment().add(1, 'years').toISOString();
    var maxTotalAmountOfAllPayments = req.query.maxTotalAmountOfAllPayments || 2000; // 2000 is the maximum: https://developer.paypal.com/docs/classic/api/adaptive-payments/Preapproval_API_Operation/

    async.auto({

      getExistingPaymentMethod: [function(cb) {
        PaymentMethod
          .findAndCountAll({
            where: {
              service: 'paypal',
              UserId: req.remoteUser.id
            }
          })
          .done(cb);
      }],

      checkExistingPaymentMethod: ['getExistingPaymentMethod', function(cb, results) {
        async.each(results.getExistingPaymentMethod.rows, function(paymentMethod, cbEach) {
          if (!paymentMethod.token) {
            return paymentMethod.destroy().done(cbEach);
          }

          getPreapprovalDetails(paymentMethod.token, function(err, response) {
            if (err) return cbEach(err);
            if (response.approved === 'false' || new Date(response.endingDate) < new Date()) {
              paymentMethod.destroy().done(cbEach);
            } else {
              cbEach();
            }
          });
        }, cb);
      }],

      createPaymentMethod: ['checkExistingPaymentMethod', function(cb) {
        PaymentMethod.create({
          service: 'paypal',
          UserId: req.remoteUser.id
        }).done(cb);
      }],

      createPayload: ['createPaymentMethod', function(cb, results) {
        var payload = {
          currencyCode: 'USD',
          startingDate: new Date().toISOString(),
          endingDate: endingDate,
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
          displayMaxTotalAmount: false,
          feesPayer: 'SENDER',
          maxTotalAmountOfAllPayments: maxTotalAmountOfAllPayments,
          requestEnvelope: {
            errorLanguage:  'en_US'
          },
          clientDetails: results.createPaymentMethod.id
        };
        return cb(null, payload);
      }],

      callPaypal: ['createPayload', function(cb, results) {
        app.paypalAdaptive.preapproval(results.createPayload, cb);
      }],

      updatePaymentMethod: ['createPaymentMethod', 'createPayload', 'callPaypal', function(cb, results) {
        var paymentMethod = results.createPaymentMethod;
        paymentMethod.token = results.callPaypal.preapprovalKey;
        paymentMethod.save().done(cb);
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

      getPaymentMethod: [function(cb) {
        PaymentMethod
          .findAndCountAll({
            where: {
              service: 'paypal',
              UserId: req.remoteUser.id,
              token: req.params.preapprovalkey
            }
          })
          .done(cb);
      }],

      checkPaymentMethod: ['getPaymentMethod', function(cb, results) {
        if (results.getPaymentMethod.rows.length === 0) {
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

      updatePaymentMethod: ['callPaypal', 'getPaymentMethod', 'checkPaymentMethod', function(cb, results) {
        var paymentMethod = results.getPaymentMethod.rows[0];
        paymentMethod.confirmedAt = new Date();
        paymentMethod.data = results.callPaypal;
        paymentMethod.number = results.callPaypal.senderEmail;
        paymentMethod.save().done(cb);
      }],

      cleanOldPaymentMethods: ['updatePaymentMethod', function(cb) {
        PaymentMethod
          .findAndCountAll({
            where: {
              service: 'paypal',
              UserId: req.remoteUser.id,
              token: {$ne: req.params.preapprovalkey}
            }
          })
          .then(function(results) {
            async.each(results.rows, function(paymentMethod, cbEach) {
              paymentMethod.destroy().done(cbEach);
            }, cb);
          })
          .catch(cb);
      }],

      createActivity: ['updatePaymentMethod', function(cb, results) {
        Activity.create({
          type: 'user.paymentMethod.created',
          UserId: req.remoteUser.id,
          data: {
            user: req.remoteUser,
            paymentMethod: results.updatePaymentMethod
          }
        }).done(cb);
      }]

    }, function(err, results) {
      if (err) return next(err);
      else res.json(results.updatePaymentMethod.info);
    });

  };

  /**
   * Public methods.
   */
  return {
    getPreapprovalKey,
    confirmPreapproval,
    getDetails,
    getPreapprovalDetails
  };

};
