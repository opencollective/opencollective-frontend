import models, { sequelize, Op } from '../models';
import _ from 'lodash';
import { convertToCurrency } from '../lib/currency';
import Promise from 'bluebird';

export function getHostedCollectives(hostid, endDate = new Date()) {
  return sequelize.query(
    `
    SELECT g.* FROM "Collectives" g
    LEFT JOIN "Members" ug ON g.id = ug."CollectiveId"
    WHERE ug.role='HOST'
      AND ug."MemberCollectiveId"=:hostid
      AND g."deletedAt" IS NULL
      AND ug."deletedAt" IS NULL
      AND ug."createdAt" < :endDate
      AND g."createdAt" < :endDate
  `,
    {
      replacements: { hostid, endDate },
      model: models.Collective,
      type: sequelize.QueryTypes.SELECT,
    },
  );
}

export function getBackersStats(startDate = new Date('2015-01-01'), endDate = new Date(), collectiveids) {
  const getBackersIds = (startDate, endDate) => {
    const where = {
      type: 'CREDIT',
      createdAt: { [Op.gte]: startDate, [Op.lt]: endDate },
    };

    if (collectiveids) {
      where.CollectiveId = { [Op.in]: collectiveids };
    }

    return models.Transaction.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('FromCollectiveId')), 'CollectiveId']],
      where,
    }).then(rows => rows.map(r => r.dataValues.CollectiveId));
  };

  const stats = {};

  return Promise.all([
    getBackersIds(new Date('2015-01-01'), endDate),
    getBackersIds(new Date('2015-01-01'), startDate),
    getBackersIds(startDate, endDate),
  ]).then(results => {
    stats.total = results[0].length;
    stats.repeat = _.intersection(results[1], results[2]).length;
    stats.new = results[2].length - stats.repeat;
    stats.inactive = stats.total - (stats.repeat + stats.new);
    return stats;
  });
}

export function sumTransactionsBy(groupBy, attribute, query) {
  const findAllQuery = {
    attributes: [[sequelize.fn('SUM', sequelize.col(attribute)), 'amount'], groupBy],
    group: [`Transaction.${groupBy}`],
    ...query,
  };
  return models.Transaction.findAll(findAllQuery).then(rows => {
    // when it's a raw query, the result is not in dataValues
    if (query.raw) {
      return rows;
    } else {
      return rows.map(r => r.dataValues);
    }
  });
}

export function sumTransactionsByCurrency(attribute = 'netAmountInCollectiveCurrency', query) {
  return sumTransactionsBy('currency', attribute, query);
}

/**
 * Sum an attribute of the Transactions table and return the result by currency with the total in host currency
 *
 * @param {*} attribute column to sum, e.g. 'netAmountInCollectiveCurrency' or 'hostFeeInHostCurrency'
 * @param {*} query query clause to reduce the scope
 * @param {*} hostCurrency currency of the host
 *
 * @post {
 *   byCurrency: [ { amount: Float!, currency: 'USD' }]
 *   totalInHostCurrency: Float!
 * }
 */
export function sumTransactions(attribute, query = {}, hostCurrency, date) {
  const { where } = query;
  if (where.createdAt) {
    date = date || where.createdAt[Op.lt] || where.createdAt[Op.gte];
  }
  const res = {};
  return sumTransactionsByCurrency(attribute, query)
    .tap(amounts => {
      res.byCurrency = amounts;
    })
    .then(amounts => Promise.map(amounts, s => convertToCurrency(s.amount, s.currency, hostCurrency || 'USD', date)))
    .then(amounts => {
      let total = 0;
      amounts.map(a => (total += a));
      res.totalInHostCurrency = Math.round(total); // in cents
      return res;
    });
}

export function getTotalHostFees(
  collectiveids,
  type,
  startDate = new Date('2015-01-01'),
  endDate = new Date(),
  hostCurrency = 'USD',
) {
  const where = {
    CollectiveId: { [Op.in]: collectiveids },
    createdAt: { [Op.gte]: startDate, [Op.lt]: endDate },
  };
  if (type) {
    where.type = type;
  }
  return sumTransactions('hostFeeInHostCurrency', where, hostCurrency);
}

export function getTotalNetAmount(
  collectiveids,
  type,
  startDate = new Date('2015-01-01'),
  endDate = new Date(),
  hostCurrency = 'USD',
) {
  const where = {
    CollectiveId: { [Op.in]: collectiveids },
    createdAt: { [Op.gte]: startDate, [Op.lt]: endDate },
  };
  if (type) {
    where.type = type;
  }
  return sumTransactions('netAmountInCollectiveCurrency', where, hostCurrency);
}
