import _ from 'lodash';
import Promise from 'bluebird';
import activities from '../constants/activities';
import includes from 'lodash/collection/includes';
import status from '../constants/expense_status';
import { getLinkHeader, getRequestedUrl } from '../lib/utils';
import { createFromPaidExpense as createTransaction } from '../lib/transactions';
import paypalAdaptive from '../gateways/paypalAdaptive';
import payExpense from '../lib/payExpense';
import errors from '../lib/errors';
import models from '../models';
import * as auth from '../middleware/security/auth';

/**
 * Create an expense.
 */
export const create = (req, res, next) => {
  const user = req.remoteUser || req.user;
  const { collective } = req;
  const attributes = Object.assign({}, req.required.expense, {
    UserId: user.id,
    CollectiveId: collective.id,
    lastEditedById: user.id
  });
  // TODO make sure that the payoutMethod is also properly stored in DB, then propagated to Transaction when paying
  models.Expense.create(attributes)
    .then(expense => models.Expense.findById(expense.id, {
      include: [
        { model: models.Collective, as: 'collective' },
        models.User
      ]
    }))
    .tap(expense => createActivity(expense, activities.COLLECTIVE_EXPENSE_CREATED))
    .tap(expense => res.send(expense))
    .catch(next);
};

/**
 * Get an expense.
 */
export const getOne = (req, res) => {
  auth.canEditExpense(req, res, (e, canEditExpense) => {
    if (canEditExpense) {
      res.json(req.expense.info);
    } else {
      // If the user is not logged in or if the logged in user cannot edit this expense (is not host, member or author)
      // then we don't return the attachment (which may contain private data)
      res.json(_.omit(req.expense.info, 'attachment'))
    }
  });
}

/**
 * Get expenses.
 */
export const list = (req, res, next) => {

  const query = Object.assign({
    where: { CollectiveId: req.collective.id },
    order: [[req.sorting.key, req.sorting.dir]],
    include: [ { model: models.User }]
  }, req.pagination);

  if (req.body.unpaid_only || req.query.unpaid_only) {
    query.where.status = [status.PENDING, status.APPROVED];
  }

  return models.Expense.findAndCountAll(query)
    .then(result => {
      result.rows = result.rows.map(instance => {
        const expense = instance.info;
        expense.user =  (req.remoteUser && req.remoteUser.isAdmin(instance.CollectiveId)) ? instance.User.info : instance.User.public;
        return expense;
      })
      return result;
    })
    .then(result => {
      // Set headers for pagination.
      req.pagination.total = result.count;
      res.set({ Link: getLinkHeader(getRequestedUrl(req), req.pagination) });
      res.send(result.rows);
    })
    .catch(next);
};

/**
 * Delete an expense.
 */
export const deleteExpense = (req, res, next) => {
  const { expense } = req;
  const user = req.remoteUser || req.user;

  assertExpenseStatus(expense, status.REJECTED)
    .then(() => expense.lastEditedById = user.id)
    .then(() => expense.save())
    .then(() => expense.destroy())
    .tap(expense => createActivity(expense, activities.COLLECTIVE_EXPENSE_DELETED))
    .tap(() => res.send({success: true}))
    .catch(next);
};

export const update = (req, res, next) => {
  const origExpense = req.expense;
  const newExpense = req.required.expense;
  const user = req.remoteUser || req.user;
  const modifiableProps = {
    approved: ['payoutMethod', 'category', 'description', 'incurredAt', 'privateMessage'],
    pending: ['amount', 'currency', 'vat', 'attachment']
  }

  let modifiablePropsList = [];

  if (origExpense.status === status.APPROVED) {
    modifiablePropsList = modifiableProps.approved;
  } else if (origExpense.status === status.PENDING) {
    modifiablePropsList = [...modifiableProps.approved, ...modifiableProps.pending];
  }
  modifiablePropsList.forEach(prop => origExpense[prop] = newExpense[prop] || origExpense[prop]);
  origExpense.updatedAt = new Date();
  origExpense.lastEditedById = user.id;
  return origExpense.save()
    .tap(expense => createActivity(expense, activities.COLLECTIVE_EXPENSE_UPDATED))
    .tap(expense => res.send(expense.info))
    .catch(next);
};

/**
 * Approve or reject an expense.
 */
export const setApprovalStatus = (req, res, next) => {
  const user = req.remoteUser || req.user;
  const { expense } = req;

  assertExpenseStatus(expense, status.PENDING)
    .then(() => {
      if (req.required.approved === false) {
        return expense.setRejected(user.id)
          .tap(exp => createActivity(exp, activities.COLLECTIVE_EXPENSE_REJECTED))
      } else {
        return expense.setApproved(user.id)
          .tap(exp => createActivity(exp, activities.COLLECTIVE_EXPENSE_APPROVED))
      }
    })
    .then(() => res.send({success: true}))
    .catch(next);
};

/**
 * Pay (reimburse) an approved expense.
 */
export const pay = (req, res, next) => {
  const user = req.remoteUser || req.user;
  const { expense } = req;
  const { payoutMethod } = req.expense;
  const isManual = !includes(models.PaymentMethod.payoutMethods, payoutMethod);
  let paymentMethod, email, paymentResponses, preapprovalDetailsResponse, collective;

  assertExpenseStatus(expense, status.APPROVED)
    // check that a collective's balance is greater than the expense
    .then(() => models.Collective.findById(expense.CollectiveId))
    .then(g => {
      collective = g;
      return collective.getBalance()
    })
    .then(balance => checkIfEnoughFundsInCollective(expense, balance))
    .then(() => isManual ? null : getPaymentMethod())
    .tap(m => paymentMethod = m)
    .then(getBeneficiaryEmail)
    .tap(e => email = e)
    .then(() => isManual ? null : pay())
    .tap(r => paymentResponses = r)

    // TODO: Remove preapprovalDetails call once the new paypal preapproval flow is solid
    .then(() => isManual ? null : paypalAdaptive.preapprovalDetails(paymentMethod.token))
    .tap(d => preapprovalDetailsResponse = d)
    .then(() => collective.getHostCollective())
    .then(host => createTransaction(host, paymentMethod, expense, paymentResponses, preapprovalDetailsResponse, expense.UserId))
    .tap(() => expense.setPaid(user.id))
    .tap(() => res.json(expense))
    .catch(err => next(formatError(err, paymentResponses)));

  function checkIfEnoughFundsInCollective(expense, balance) {
    const estimatedFees = isManual ? 0 : Math.ceil(expense.amount*.029 + 30); // 2.9% + 30 is a typical fee.

    if (balance >= (expense.amount + estimatedFees)) { 
      return Promise.resolve();
    } else {
      return Promise.reject(new errors.BadRequest(`Not enough funds in this collective to pay this request. Please add funds first.`));
    }
  }

  function getPaymentMethod() {
    // Use first paymentMethod found
    return models.PaymentMethod.findOne({
      where: {
        service: payoutMethod,
        CollectiveId: req.remoteUser.CollectiveId,
        confirmedAt: {$ne: null}
      },
      order: [['confirmedAt', 'DESC']]
    })
    .tap(paymentMethod => {
      if (!paymentMethod) {
        throw new errors.BadRequest('No payment method found');
      } else if (paymentMethod.endDate && (paymentMethod.endDate < new Date())) {
        throw new errors.BadRequest('Payment method expired');
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
    return payExpense(payoutMethod)(req.collective, expense, email, preapprovalKey);
  }
};

function assertExpenseStatus(expense, statusToConfirm) {
  if (statusToConfirm === status.PENDING && expense.status === status.APPROVED) {
    return Promise.reject(new errors.BadRequest(`Expense ${expense.id} is already approved.`));
  } else if (statusToConfirm === status.PENDING && expense.status === status.REJECTED) {
    return Promise.reject(new errors.BadRequest(`Expense ${expense.id} is already rejected.`));
  } else if (statusToConfirm === status.APPROVED && expense.status === status.PAID) {
    return Promise.reject(new errors.BadRequest(`Expense ${expense.id} is already paid.`));
  } else if (expense.status !== statusToConfirm) {
    return Promise.reject(new errors.BadRequest(`Expense ${expense.id} status should be ${statusToConfirm}.`));
  }
  return Promise.resolve();
}

function createActivity(expense, type) {
  return models.Collective.findById(expense.User.CollectiveId)
    .then(userCollective => models.Activity.create({
    type,
    UserId: expense.User.id,
    CollectiveId: expense.collective.id,
    data: {
      collective: expense.collective.minimal,
      user: expense.User.minimal,
      fromCollective: userCollective.minimal,
      expense: expense.info
    }
  }));
}

function formatError(err) {
  if (err.message.indexOf('The total amount of all payments exceeds the maximum total amount for all payments') !==-1) {
    return new errors.BadRequest('Not enough funds in your existing Paypal preapproval. Please reapprove through https://app.opencollective.com.');
  } else {
    return new errors.BadRequest(err.message)
  }
}
