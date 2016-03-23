var _ = require('lodash');

module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models');
  var User = models.User;
  var Group = models.Group;
  var Transaction = models.Transaction;
  var errors = app.errors;

  /**
   * Parse id.
   */
  var parseId = function(id, callback) {
    var id = parseInt(id);
    if (_.isNaN(id)) {
      return callback(new errors.BadRequest('This is not a correct id.'));
    } else {
      callback(null, id);
    }
  }

  /**
   * Public methods.
   */
  return {

    /**
     * Userid.
     */
    userid: function(req, res, next, userid) {
      parseId(userid, function(e, userid) {
        if (e) return next(e);
        User
          .find(userid)
          .then(function(user) {
            if (!user) {
              return next(new errors.NotFound('User \'' + userid + '\' not found'));
            } else {
              req.user = user;
              next();
            }
          })
          .catch(next);
      });
    },

    /**
     * Groupid.
     */
    groupid: (req, res, next, groupid) => {
      const callback = group => {
        if (!group) {
          return next(new errors.NotFound('Group \'' + groupid + '\' not found'));
        } else {
          req.group = group;
          next();
        }
      };

      if (isNaN(groupid)) { // slug
        Group
          .find({
            where: {
              slug: groupid.toLowerCase()
            }
          })
          .then(callback)
          .catch(next)
      } else {
        Group
          .find(groupid)
          .then(callback)
          .catch(next);
      }
    },

    /**
     * Transactionid.
     */
    transactionid: function(req, res, next, transactionid) {
      parseId(transactionid, function(e, transactionid) {
        if (e) return next(e);
        Transaction
          .find(transactionid)
          .then(function(transaction) {
            if (!transaction) {
              return next(new errors.NotFound('Transaction \'' + transactionid + '\' not found'));
            } else {
              req.transaction = transaction;
              next();
            }
          })
          .catch(next);
      });
    },

    /**
     * Transactionid for a paranoid (deleted) ressource
     */
    paranoidtransactionid: (req, res, next, id) => {
      parseId(id, (e, id) => {
        if (e) return next(e);
        Transaction
          .findOne({
            where: { id },
            paranoid: false
          })
          .then((transaction) => {
            if (!transaction) {
              return next(new errors.NotFound(`Transaction ${id} not found`));
            } else {
              req.paranoidtransaction = transaction;
              next();
            }
          })
          .catch(next);
      });
    },
  }
};
