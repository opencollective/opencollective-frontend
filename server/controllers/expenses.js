/**
 * Dependencies.
 */

const Promise = require('bluebird');
const activities = require('../constants/activities');
const includes = require('lodash/collection/includes');
const status = require('../constants/expense_status');

/**
 * Controller.
 */

module.exports = (app) => {

  const errors = app.errors;
  const models = app.set('models');
  const createTransaction = require('../lib/transactions')(app).createFromPaidExpense;
  const paypal = require('./paypal')(app);
  const payExpense = require('../lib/payExpense')(app);

  /**
   * Create an expense.
   */

  const create = (req, res, next) => {
    const user = req.remoteUser || req.user;
    const group = req.group;
    const attributes = Object.assign({}, req.required.expense, {
      UserId: user.id,
      GroupId: group.id
    });
    models.Expense.create(attributes)
      .then(expense => models.Expense.findById(expense.id, { include: [ models.Group, models.User ]}))
      .tap(expense => createActivity(expense, activities.GROUP_EXPENSE_CREATED))
      .tap(expense => res.send(expense))
      .catch(next);
  };

  /**
   * Delete an expense.
   */

  const deleteExpense = (req, res, next) => {
    const expense = req.expense;

    assertExpenseStatus(expense, status.PENDING)
      .then(() => expense.destroy())
      .tap(expense => createActivity(expense, activities.GROUP_EXPENSE_DELETED))
      .tap(() => res.send({success: true}))
      .catch(next);
  };

  /**
   * Approve or reject an expense.
   */

  const setApprovalStatus = (req, res, next) => {
    const expense = req.expense;
    var preapprovalDetails;

    assertExpenseStatus(expense, status.PENDING)
      .then(() => {
        if (req.required.approved === false) {
          return req.expense.setRejected()
            .tap(expense => createActivity(expense, activities.GROUP_EXPENSE_REJECTED))
        }
        return fetchPaymentMethod(req.remoteUser.id)
          .then(paymentMethod => getPreapprovalDetails(paymentMethod))
          .tap(d => preapprovalDetails = d)
          .then(checkIfEnoughFunds(expense.amount))
          .then(() => expense.setApproved())
          .tap(expense => createActivity(expense, activities.GROUP_EXPENSE_APPROVED))
      })
      .then(() => res.send({success: true}))
      .catch(err => next(formatError(err, preapprovalDetails)));

    function fetchPaymentMethod(UserId) {
      return models.PaymentMethod.findOne({
        where: {
          service: 'paypal',
          UserId
        }
      })
      .then(paymentMethod => {
        if (!paymentMethod || !paymentMethod.token) {
          return new errors.BadRequest("You can't approve an expense without linking your PayPal account");
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
          return Promise.reject(new errors.BadRequest(`Not enough funds (${maxAmount} ${currency} left) to approve expense.`));
        }
        return Promise.resolve();
      };
    }
  };

  /**
   * Pay (reimburse) an approved expense.
   */

  const pay = (req, res, next) => {
    const expense = req.expense;
    const payoutMethod = req.required.payoutMethod;
    const isManual = !includes(models.PaymentMethod.payoutMethods, payoutMethod);
    var paymentMethod, email, paymentResponse;

    assertExpenseStatus(expense, status.APPROVED)
      .then(() => isManual ? null : getPaymentMethod())
      .tap(m => paymentMethod = m)
      .then(getBeneficiaryEmail)
      .tap(e => email = e)
      .then(() => isManual ? null : pay())
      .then(r => paymentResponse = r)
      .then(paymentResponse => createTransaction(payoutMethod, paymentMethod, paymentResponse, expense))
      .tap(() => expense.setPaid())
      .tap(() => res.json(expense))
      .catch(err => next(formatError(err, paymentResponse)));

    function getPaymentMethod() {
      // Use first paymentMethod found
      return models.PaymentMethod.findOne({
        where: {
          service: payoutMethod,
          UserId: req.remoteUser.id,
          confirmedAt: {$ne: null}
        },
        order: [['confirmedAt', 'DESC']]
      })
      .tap(paymentMethod => {
        if (!paymentMethod) {
          throw new errors.BadRequest('This user has no confirmed paymentMethod linked with this service.');
        }
      });
    }

    function getBeneficiaryEmail() {
      return expense.getUser().then(user => user.paypalEmail || user.email);
    }

    /**
     * TODO Verify enough money left on preapprovalKey (paymentMethod.token).
     * If we send it to payServices['paypal'] with not enough money left, it will fail (gracefully).
     * If we don't send it, it will return a `paymentApprovalUrl` that we can use to redirect the user
     * to PayPal.com to manually approve the payment.
     */
    function pay() {
      const preapprovalKey = paymentMethod.token;
      return payExpense(payoutMethod)(req.group, expense, email, preapprovalKey);
    }
  };

  return {
    create,
    deleteExpense,
    setApprovalStatus,
    pay
  };

  function assertExpenseStatus(expense, status) {
    if (expense.status !== status) {
      return Promise.reject(new errors.BadRequest(`Expense ${expense.id} status should be ${status}.`));
    }
    return Promise.resolve();
  }

  function createActivity(expense, type) {
    return models.Activity.create({
      type,
      UserId: expense.User.id,
      GroupId: expense.Group.id,
      data: {
        group: expense.Group.info,
        user: expense.User.info,
        expense: expense.info
      }
    });
  }

  function formatError(err, paypalResponse) {
    if (paypalResponse) {
      console.error('PayPal error', JSON.stringify(paypalResponse));
      if (paypalResponse.error instanceof Array) {
        var message = paypalResponse.error[0].message;
        return new errors.BadRequest(message);
      }
    }
    return err;
  }
};
