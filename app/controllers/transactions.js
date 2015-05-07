/**
 * Dependencies.
 */
var utils = require('../lib/utils');
var _ = require('lodash');

/**
 * Controller.
 */
module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models');
  var Transaction = models.Transaction;
  var errors = app.errors;

  /**
   * Public methods.
   */
  return {

    /**
     * (Dis)approve a transaction.
     */
    approve: function(req, res, next) {
      req.transaction.approved = req.required['approved'];
      req.transaction.approvedAt = new Date();

      req.transaction
        .save()
        .then(function(transaction) {
          res.send({success: true});
        })
        .catch(next);
    },

  }

};
