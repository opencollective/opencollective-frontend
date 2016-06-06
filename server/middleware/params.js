const _ = require('lodash');

module.exports = (app) => {

  /**
   * Internal Dependencies.
   */
  const models = app.set('models');
  const User = models.User;
  const Group = models.Group;
  const Transaction = models.Transaction;
  const Expense = models.Expense;
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
   * Get a record by id or by name
   */
   function getByKeyValue(model, key, value) {
     return model
       .find({ where: { [key]: value.toLowerCase() } })
       .tap(result => {
         if(!result) throw new errors.NotFound(`${model.getTableName()} '${value}' not found`);
       });
   }

  /**
   * Public methods.
   */
  return {

    /**
     * Userid.
     */
    userid: (req, res, next, userIdOrName) => {
      getByKeyValue(User, isNaN(userIdOrName) ? 'username' : 'id', userIdOrName)
        .then(user => req.user = user)
        .asCallback(next);
    },

    /**
     * Groupid.
     */
    groupid: (req, res, next, groupIdOrSlug) => {
      getByKeyValue(Group, isNaN(groupIdOrSlug) ? 'slug' : 'id', groupIdOrSlug)
        .then(group => req.group = group)
        .asCallback(next);
    },

    /**
     * Transactionid.
     */
    transactionid: (req, res, next, transactionid) => {
      parseId(transactionid)
        .then(id => Transaction.findById(id))
        .then((transaction) => {
          if (!transaction) {
            return next(new errors.NotFound(`Transaction '${transactionid}' not found`));
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

    /**
     * ExpenseId.
     */
    expenseid: (req, res, next, expenseid) => {
      parseId(expenseid)
        .then(id => Expense.findById(id))
        .then((expense) => {
          if (!expense) {
            return next(new errors.NotFound(`Expense '${expenseid}' not found`));
          } else {
            req.expense = expense;
            next();
          }
        })
        .catch(next);
    }
  }
};
