const _ = require('lodash');

module.exports = (app) => {

  /**
   * Internal Dependencies.
   */
  const models = app.set('models');
  const User = models.User;
  const Group = models.Group;
  const Transaction = models.Transaction;
  const errors = app.errors;

  /**
   * Parse id.
   */
  const parseId = (param) => {
    const id = parseInt(param);

    if (_.isNaN(id)) {
      return Promise.reject(new errors.BadRequest('This is not a correct id.'))
    } else {
      return Promise.resolve(id);
    }
  }

  /**
   * Public methods.
   */
  return {

    /**
     * Userid.
     */
    userid: (req, res, next, userid) => {
      parseId(userid)
        .then(id => User.find(id))
        .then((user) => {
          if (!user) {
            return next(new errors.NotFound('User \'' + userid + '\' not found'));
          } else {
            req.user = user;
            next();
          }
        })
        .catch(next)
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
    transactionid: (req, res, next, transactionid) => {
      parseId(transactionid)
        .then(id => Transaction.find(id))
        .then((transaction) => {
          if (!transaction) {
            return next(new errors.NotFound('Transaction \'' + transactionid + '\' not found'));
          } else {
            req.transaction = transaction;
            next();
          }
        })
        .catch(next);
    },

    /**
     * Transactionid for a paranoid (deleted) ressource
     */
    paranoidtransactionid: (req, res, next, id) => {
      parseId(id)
        .then(id => {
          return Transaction.findOne({
            where: { id },
            paranoid: false
          });
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
    },
  }
};
