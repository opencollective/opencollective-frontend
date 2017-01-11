import _ from 'lodash';
import Promise from 'bluebird';
import activities from '../constants/activities';
import includes from 'lodash/collection/includes';
import status from '../constants/expense_status';
import {getLinkHeader, getRequestedUrl} from '../lib/utils';
import {createFromPaidExpense as createTransaction} from '../lib/transactions';
import {getPreapprovalDetails as gpd} from './paypal';
import payExpense from '../lib/payExpense';
import errors from '../lib/errors';
import sequelize from 'sequelize';
import models from '../models';
import * as auth from '../middleware/security/auth';

const getPreapprovalDetails = Promise.promisify(gpd);

/**
 * Create an expense.
 */
export const create = (req, res, next) => {
  const user = req.remoteUser || req.user;
  const { group } = req;
  const attributes = Object.assign({}, req.required.expense, {
    UserId: user.id,
    GroupId: group.id,
    lastEditedById: user.id
  });
  // TODO make sure that the payoutMethod is also properly stored in DB, then propagated to Transaction when paying
  models.Expense.create(attributes)
    .then(expense => models.Expense.findById(expense.id, { include: [ models.Group, models.User ]}))
    .tap(expense => createActivity(expense, activities.GROUP_EXPENSE_CREATED))
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
    where: { GroupId: req.group.id },
    order: [[req.sorting.key, req.sorting.dir]]
  }, req.pagination);

  if (req.body.unpaid_only || req.query.unpaid_only) {
    query.where.status = [status.PENDING, status.APPROVED];
  }

  return models.Expense.findAndCountAll(query)
    .then(expenses => {
      const ids = _.pluck(expenses.rows, 'id');
      return models.Comment.findAll({
        attributes: ['ExpenseId', [sequelize.fn('COUNT', sequelize.col('ExpenseId')), 'comments']],
        where: { ExpenseId: { $in: ids }},
        group: ['ExpenseId']
      })
      .then(commentIds => {
        const commentsCount =  _.groupBy(commentIds, 'ExpenseId');
        expenses.rows = expenses.rows.map(expense => {
          const r = expense.info;
          commentsCount[r.id] = commentsCount[r.id] || [{ dataValues: { comments: 0 } }];
          r.commentsCount = parseInt(commentsCount[r.id][0].dataValues.comments,10);
          return r;
        });
        return expenses;
      })
    })
    .then(expenses => {
      // Set headers for pagination.
      req.pagination.total = expenses.count;
      res.set({ Link: getLinkHeader(getRequestedUrl(req), req.pagination) });
      res.send(expenses.rows);
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
    .tap(expense => createActivity(expense, activities.GROUP_EXPENSE_DELETED))
    .tap(() => res.send({success: true}))
    .catch(next);
};

export const update = (req, res, next) => {
  const origExpense = req.expense;
  const newExpense = req.required.expense;
  const user = req.remoteUser || req.user;
  const modifiableProps = [
    'amount',
    'attachment',
    'category',
    'comment',
    'incurredAt',
    'currency',
    'notes',
    'payoutMethod',
    'title',
    'vat'
  ];

  assertExpenseStatus(origExpense, status.PENDING)
    .tap(() => {
      modifiableProps.forEach(prop => origExpense[prop] = newExpense[prop] || origExpense[prop]);
      origExpense.updatedAt = new Date();
      origExpense.lastEditedById = user.id;
    })
    .then(() => origExpense.save())
    .tap(expense => createActivity(expense, activities.GROUP_EXPENSE_UPDATED))
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
          .tap(exp => createActivity(exp, activities.GROUP_EXPENSE_REJECTED))
      } else {
        return expense.setApproved(user.id)
          .tap(exp => createActivity(exp, activities.GROUP_EXPENSE_APPROVED))
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
  let paymentMethod, email, paymentResponse, preapprovalDetails;

  assertExpenseStatus(expense, status.APPROVED)
    // check that a group's balance is greater than the expense
    .then(() => models.Group.findById(expense.GroupId))
    .then(group => group.getBalance())
    .then(balance => checkIfEnoughFundsInGroup(expense, balance))
    .then(() => isManual ? null : getPaymentMethod())
    .tap(m => paymentMethod = m)
    .then(getBeneficiaryEmail)
    .tap(e => email = e)
    .then(() => isManual ? null : pay())
    .tap(r => paymentResponse = r)
    .then(() => isManual ? null : getPreapprovalDetails(paymentMethod.token))
    .tap(d => preapprovalDetails = d)
    .then(() => createTransaction(paymentMethod, expense, paymentResponse, preapprovalDetails, expense.UserId))
    .tap(() => expense.setPaid(user.id))
    .tap(() => res.json(expense))
    .catch(err => next(formatError(err, paymentResponse)));

  function checkIfEnoughFundsInGroup(expense, balance) {
    if (balance >= expense.amount) {
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
      const { message } = paypalResponse.error[0];
      return new errors.BadRequest(message);
    }
  }
  return err;
}
