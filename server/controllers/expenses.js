/**
 * Dependencies.
 */

const constants = require('../constants');

/**
 * Controller.
 */

module.exports = (app) => {

  // const errors = app.errors;
  const models = app.set('models');
  const Expense = models.Expense;
  const paypal = require('./paypal')(app);

  const createNewExpenseActivity = (id) => {

    return Expense.findOne({
      where: { id },
      include: [
        { model: models.Group },
        { model: models.User }
      ]
    })
    .then(expense => {
      return models.Activity.create({
        type: constants.activities.GROUP_EXPENSE_CREATED,
        UserId: expense.User.id,
        GroupId: expense.Group.id,
        data: {
          group: expense.Group.info,
          user: expense.User.info,
          expense: expense.info
        }
      });
    });
  };

  /**
   * Create an expense and add it to a group.
   */

  const create = (req, res, next) => {
    const attributes = req.required.expense;
    const group = req.group;
    const user = req.remoteUser || req.user || {};
    Expense.create(attributes)
      .tap(expense => expense.setUser(user))
      .tap(expense => expense.setGroup(group))
      .tap(expense => createNewExpenseActivity(expense.id))
      .then(expense => res.send(expense))
      .catch(next);
  };

  /**
   * Set the approval status of an expense
   */

  const setApprovalStatus = (req, res, next) => {
    const expense = req.expense;

    if (req.required.approved === false) {
      return expense.reject()
        .then(() => res.send({success: true}))
        .catch(next);
    }

    // We need to check the funds before approving a transaction
    async.auto({
      fetchPaymentMethods: (cb) => {
        PaymentMethod.findAll({
          where: {
            service: 'paypal',
            UserId: req.remoteUser.id
          }
        })
        .done(cb);
      },

      getPreapprovalDetails: ['fetchPaymentMethods', (cb, results) => {
        const paymentMethod = results.fetchPaymentMethods[0];

        if (!paymentMethod || !paymentMethod.token) {
          return cb(new errors.BadRequest('You can\'t approve a transaction without linking your PayPal account'));
        }

        paypal.getPreapprovalDetails(paymentMethod.token, cb);
      }],

      checkIfEnoughFunds: ['getPreapprovalDetails', (cb, results) => {
        const maxAmount = Number(results.getPreapprovalDetails.maxTotalAmountOfAllPayments);
        const currency = results.getPreapprovalDetails.currencyCode;

        if (Math.abs(req.transaction.amount) > maxAmount) {
          return cb(new errors.BadRequest(`Not enough funds (${maxAmount} ${currency} left) to approve transaction.`));
        }

        cb();
      }]
    }, (err, results) => {
      if (err && results.getPreapprovalDetails) {
        console.error('PayPal error', JSON.stringify(results.getPreapprovalDetails));
        if (results.getPreapprovalDetails.error instanceof Array) {
          var message = results.getPreapprovalDetails.error[0].message;
          return next(new errors.BadRequest(message));
        }
      }

      if (err) return next(err);

      expense.approve()
        .then(() => res.send({success: true}))
        .catch(next);

    });
  };


  return {
    create,
    setApprovalStatus
  };

};
