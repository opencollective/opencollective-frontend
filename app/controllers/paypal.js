/**
 * Dependencies.
 */
var _ = require('lodash');
var async = require('async');
var config = require('config');
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
   * Get a preapproval key for a user.
   */
  var getPreapprovalKey = function(req, res, next) {
    var payload = {
      currencyCode: 'USD',
      startingDate: new Date().toISOString(),
      endingDate: new Date('2020-01-01').toISOString(),
      returnUrl: 'http://your-website.com',
      cancelUrl: 'http://your-website.com',
      ipnNotificationUrl: 'http://your-ipn-listener.com',
      maxNumberOfPayments: 1,
      displayMaxTotalAmount: true,
      maxTotalAmountOfAllPayments: '100.00',
      requestEnvelope: {
        errorLanguage:  'en_US'
      }
    };
    // app.paypalAdaptive.preapproval(payload, cb);
  };

  /**
   * Confirm a preapproval.
   */
  var confirmPreapproval = function(req, res, next) {
    var payload = {
      preapprovalKey: 'bla'
    };
    // app.paypalAdaptive.preapprovalDetails(payload, cb);
  };

  /**
   * Public methods.
   */
  return {

    getPreapprovalKey: getPreapprovalKey,
    confirmPreapproval: confirmPreapproval

  }

};
