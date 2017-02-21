import _ from 'lodash';
import models from '../models';
import errors from '../lib/errors';
import { isUUID } from '../lib/utils';

const {
  User,
  Group,
  Transaction,
  Expense,
  Comment
} = models;

/**
 * Parse id or uuid and returns the where condition to get the element
 * @POST: { uuid: String } or { id: Int }
 */
const parseId = (param) => {
  if (isUUID(param)) {
    return Promise.resolve({ uuid: param });
  }

  const id = parseInt(param);

  if (_.isNaN(id)) {
    return Promise.reject(new errors.BadRequest('This is not a correct id.'))
  } else {
    return Promise.resolve({ id });
  }
};

/**
 * Get a record by id or by name
 */
 function getByKeyValue(model, key, value) {
   return model
     .find({ where: { [key]: value.toLowerCase() } })
     .tap(result => {
       if (!result) throw new errors.NotFound(`${model.getTableName()} '${value}' not found`);
     });
 }

/**
 * userid
 */
export function userid(req, res, next, userIdOrName) {
  getByKeyValue(User, isNaN(userIdOrName) ? 'username' : 'id', userIdOrName)
    .then(user => req.user = user)
    .asCallback(next);
}

/**
 * groupid
 */
export function groupid(req, res, next, groupIdOrSlug) {
  getByKeyValue(Group, isNaN(groupIdOrSlug) ? 'slug' : 'id', groupIdOrSlug)
    .then(group => req.group = group)
    .asCallback(next);
}

/**
 * commentid
 */
export function commentid(req, res, next, commentid) {
  parseId(commentid)
    .then(where => Comment.findOne({where}))
    .then((comment) => {
      if (!comment) {
        return next(new errors.NotFound(`Comment '${commentid}' not found`));
      } else {
        req.comment = comment;
        next();
      }
    })
    .catch(next);
}

/**
 * transactionid
 */
export function transactionid(req, res, next, transactionid) {
  parseId(transactionid)
    .then(where => Transaction.findOne({where}))
    .then((transaction) => {
      if (!transaction) {
        return next(new errors.NotFound(`Transaction '${transactionid}' not found`));
      } else {
        req.transaction = transaction;
        next();
      }
    })
    .catch(next);
}

/**
 * Transactionid for a paranoid (deleted) ressource
 */
export function paranoidtransactionid(req, res, next, id) {
  parseId(id)
    .then(where => {
      return Transaction.findOne({
        where,
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
}

/**
 * ExpenseId.
 */
export function expenseid(req, res, next, expenseid) {
  let queryInGroup, NotFoundInGroup = '';
  if (req.params.groupid) {
    queryInGroup = { GroupId: req.params.groupid };
    NotFoundInGroup = `in group ${req.params.groupid}`;
  }
  parseId(expenseid)
    .then(where => Expense.findOne({
      where: Object.assign({}, where, queryInGroup),
      include: [
        { model: models.Group },
        { model: models.User }
      ]
    }))
    .then((expense) => {
      if (!expense) {
        return next(new errors.NotFound(`Expense '${expenseid}' not found ${NotFoundInGroup}`));
      } else {
        req.expense = expense;
        next();
      }
    })
    .catch(next);
}
