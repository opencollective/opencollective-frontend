/**
 * Dependencies.
 */

const Promise = require('bluebird');
const constants = require('../constants');

/**
 * Controller.
 */

module.exports = (app) => {

  const errors = app.errors;
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
    var preapprovalDetails;

    if (req.required.approved === false) {
      return req.expense.reject()
        .then(() => res.send({success: true}))
        .catch(next);
    }

    fetchPaymentMethod(req.remoteUser.id)
      .then(paymentMethod => getPreapprovalDetails(paymentMethod))
      .tap(d => preapprovalDetails = d)
      .then(checkIfEnoughFunds(req.expense.amount))
      .then(() => req.expense.approve())
      .then(() => res.send({success: true}))
      .catch(err => handleError(err, next, preapprovalDetails));
  };

  return {
    create,
    setApprovalStatus
  };

  function fetchPaymentMethod(UserId) {
    return models.PaymentMethod.findAll({
      where: {
        service: 'paypal',
        UserId
      }
    })
      .then(paymentMethods => {
        const paymentMethod = paymentMethods[0];
        if (!paymentMethod || !paymentMethod.token) {
          return new errors.BadRequest("You can't approve a transaction without linking your PayPal account");
        }
        return paymentMethod;
      });
  }

  function getPreapprovalDetails(paymentMethod) {
    return Promise.promisify(paypal.getPreapprovalDetails)(paymentMethod.token);
  }

  function checkIfEnoughFunds(txAmount) {
    return preapprovalDetails => {
      const maxAmount = Number(preapprovalDetails.maxTotalAmountOfAllPayments);
      const currency = preapprovalDetails.currencyCode;

      if (Math.abs(txAmount) > maxAmount) {
        return Promise.reject(new errors.BadRequest(`Not enough funds (${maxAmount} ${currency} left) to approve transaction.`));
      }
      return Promise.resolve();
    };
  }

  function handleError(err, next, preapprovalDetails) {
    if (preapprovalDetails) {
      console.error('PayPal error', JSON.stringify(preapprovalDetails));
      if (preapprovalDetails.error instanceof Array) {
        var message = preapprovalDetails.error[0].message;
        return next(new errors.BadRequest(message));
      }
    }
    return next(err);
  }
};
