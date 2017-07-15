import _ from 'lodash';
import models from '../models';
import errors from '../lib/errors';
import { isUUID } from '../lib/utils';
import { hasRole } from '../lib/auth';

const {
  User,
  Collective,
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
 * collectiveid
 */
export function collectiveid(req, res, next, collectiveIdOrSlug) {
  getByKeyValue(Collective, isNaN(collectiveIdOrSlug) ? 'slug' : 'id', collectiveIdOrSlug)
    .then(collective => req.collective = collective)
    .then(() => {
      if (req.remoteUser) {
        return hasRole(req.remoteUser.id, req.collective.id, ['MEMBER','HOST'])
      }
    })
    .then(canEdit => {
      if (canEdit) {
        req.canEditCollective = canEdit;
      }
    })
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
 * transactionuuid
 */
export function transactionuuid(req, res, next, transactionuuid) {
  if (!isUUID(transactionuuid))
    return next(new errors.BadRequest("Must provide transaction uuid"));

  Transaction.findOne({where: { uuid: transactionuuid }})
    .then((transaction) => {
      if (!transaction) {
        return next(new errors.NotFound(`Transaction '${transactionuuid}' not found`));
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
  let queryInCollective, NotFoundInCollective = '';
  if (req.params.collectiveid) {
    queryInCollective = { CollectiveId: req.params.collectiveid };
    NotFoundInCollective = `in collective ${req.params.collectiveid}`;
  }
  parseId(expenseid)
    .then(where => Expense.findOne({
      where: Object.assign({}, where, queryInCollective),
      include: [
        { model: models.Collective },
        { model: models.User }
      ]
    }))
    .then((expense) => {
      if (!expense) {
        return next(new errors.NotFound(`Expense '${expenseid}' not found ${NotFoundInCollective}`));
      } else {
        req.expense = expense;
        next();
      }
    })
    .catch(next);
}
