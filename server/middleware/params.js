import _ from 'lodash';
import models from '../models';
import errors from '../lib/errors';
import { isUUID } from '../lib/utils';

const { User, Collective, Transaction, Expense } = models;

/**
 * Parse id or uuid and returns the where condition to get the element
 * @POST: { uuid: String } or { id: Int }
 */
const parseIdOrUUID = param => {
  if (isUUID(param)) {
    return Promise.resolve({ uuid: param });
  }

  const id = parseInt(param);

  if (_.isNaN(id)) {
    return Promise.reject(new errors.BadRequest('This is not a correct id.'));
  } else {
    return Promise.resolve({ id });
  }
};

/**
 * Get a record by id or by name
 */
function getByKeyValue(model, key, value) {
  return model.findOne({ where: { [key]: value.toLowerCase() } }).tap(result => {
    if (!result) {
      throw new errors.NotFound(`${model.getTableName()} '${value}' not found`);
    }
  });
}

export function uuid(req, res, next, uuid) {
  if (uuid.match(/^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i)) {
    req.params.uuid = uuid;
  } else {
    const id = parseInt(uuid);
    if (!_.isNaN(id)) {
      req.params.id = id;
    }
  }
  next();
}

/**
 * userid
 */
export function userid(req, res, next, userIdOrName) {
  getByKeyValue(User, isNaN(userIdOrName) ? 'username' : 'id', userIdOrName)
    .then(user => (req.user = user))
    .asCallback(next);
}

/**
 * collectiveid
 */
export function collectiveid(req, res, next, collectiveIdOrSlug) {
  getByKeyValue(Collective, isNaN(collectiveIdOrSlug) ? 'slug' : 'id', collectiveIdOrSlug)
    .then(collective => (req.collective = collective))
    .asCallback(next);
}

/**
 * transactionuuid
 */
export function transactionuuid(req, res, next, transactionuuid) {
  if (!isUUID(transactionuuid)) {
    next(new errors.BadRequest('Must provide transaction uuid'));
    return null;
  }

  Transaction.findOne({ where: { uuid: transactionuuid } })
    .then(transaction => {
      if (!transaction) {
        next(new errors.NotFound(`Transaction '${transactionuuid}' not found`));
        return null;
      } else {
        req.transaction = transaction;
        next();
        return null;
      }
    })
    .catch(next);
}

/**
 * Transactionid for a paranoid (deleted) ressource
 */
export function paranoidtransactionid(req, res, next, id) {
  parseIdOrUUID(id)
    .then(where => {
      return Transaction.findOne({
        where,
        paranoid: false,
      });
    })
    .then(transaction => {
      if (!transaction) {
        next(new errors.NotFound(`Transaction ${id} not found`));
        return null;
      } else {
        req.paranoidtransaction = transaction;
        next();
        return null;
      }
    })
    .catch(next);
}

/**
 * ExpenseId.
 */
export function expenseid(req, res, next, expenseid) {
  let queryInCollective,
    NotFoundInCollective = '';
  if (req.params.collectiveid) {
    queryInCollective = { CollectiveId: req.params.collectiveid };
    NotFoundInCollective = `in collective ${req.params.collectiveid}`;
  }
  parseIdOrUUID(expenseid)
    .then(where =>
      Expense.findOne({
        where: Object.assign({}, where, queryInCollective),
        include: [{ model: models.Collective, as: 'collective' }, { model: models.User }],
      }),
    )
    .then(expense => {
      if (!expense) {
        next(new errors.NotFound(`Expense '${expenseid}' not found ${NotFoundInCollective}`));
        return null;
      } else {
        req.expense = expense;
        next();
        return null;
      }
    })
    .catch(next);
}
