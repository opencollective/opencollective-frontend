import models, { sequelize } from '../models';
import { getListOfAccessibleUsers } from '../lib/auth';
import { type } from '../constants/transactions';
import DataLoader from 'dataloader';
import { get, groupBy } from 'lodash';
import debugLib from 'debug';
const debug = debugLib('loaders');

const sortResults = (keys, results, attribute = 'id', defaultValue) => {
  debug("sortResults", attribute, results.length);
  const resultsById = {};
  results.forEach(r => {
    const key = r.dataValues ? r.dataValues[attribute] : r[attribute];
    if (!key) {
      return;
    }
    // If the default value is an array
    // e.g. when we want to return all the paymentMethods for a list of collective ids.
    if (defaultValue instanceof Array) {
      resultsById[key] = resultsById[key] || [];
      resultsById[key].push(r);
    } else {
      resultsById[key] = r;
    }
  });
  return keys.map(id => resultsById[id] || defaultValue);
}

export const loaders = (req) => {
  return {
    collective: {
      findById: new DataLoader(ids => models.Collective
        .findAll({ where: { id: { $in: ids }}})
        .then(collectives => sortResults(ids, collectives))
      ),
      balance: new DataLoader(ids => models.Transaction.findAll({
          attributes: [
            'CollectiveId',
            [ sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('netAmountInCollectiveCurrency')), 0), 'balance' ]
          ],
          where: { CollectiveId: { $in: ids } },
          group: ['CollectiveId']
        })
        .then(results => sortResults(ids, results, 'CollectiveId'))
        .map(result => get(result, 'dataValues.balance') || 0)
      ),
      stats: {
        collectives: new DataLoader(ids => models.Collective.findAll({
            attributes: [
              'HostCollectiveId',
              [ sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count' ]
            ],
            where: { HostCollectiveId: { $in: ids } },
            group: ['HostCollectiveId']
          })
          .then(results => sortResults(ids, results, 'TierId'))
          .map(result => get(result, 'dataValues.count') || 0)
        ),
        expenses: new DataLoader(ids => models.Expense.findAll({
          attributes: [
            'CollectiveId',
            'status',
            [ sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count' ]
          ],
          where: { CollectiveId: { $in: ids } },
          group: ['CollectiveId', 'status']
        })
        .then(rows => {
          const results = groupBy(rows, "CollectiveId");
          return Object.keys(results).map(CollectiveId => {
            const stats = {};
            results[CollectiveId].map(e => e.dataValues).map(stat => {
              stats[stat.status] = stat.count;
            });
            return {
              CollectiveId: Number(CollectiveId),
              ...stats
            };
          });
        })
        .then(results => sortResults(ids, results, 'CollectiveId'))
        )
      }
    },
    // This one is tricky. We need to make sure that the remoteUser can view the personal details of the user.
    getUserDetailsByCollectiveId: new DataLoader(UserCollectiveIds => getListOfAccessibleUsers(req.remoteUser, UserCollectiveIds)
      .then(accessibleUserCollectiveIds => models.User.findAll({ where: { CollectiveId: { $in: accessibleUserCollectiveIds } }}))
      .then(results => sortResults(UserCollectiveIds, results, 'CollectiveId', {}))
    ),
    tiers: {
      findById: new DataLoader(ids => models.Tier
        .findAll({ where: { id: { $in: ids }}})
        .then(results => sortResults(ids, results, 'id'))),
      totalOrders: new DataLoader(ids => models.Order.findAll({
        attributes: [
          'TierId',
          [ sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count' ]
        ],
        where: { TierId: { $in: ids } },
        group: ['TierId']
      })
      .then(results => sortResults(ids, results, 'TierId'))
      .map(result => get(result, 'dataValues.count') || 0))
  },
    paymentMethods: {
      findById: new DataLoader(ids => models.PaymentMethod
        .findAll({ where: { id: { $in: ids }}})
        .then(results => sortResults(ids, results, 'id'))
      ),
      findByCollectiveId: new DataLoader(CollectiveIds => models.PaymentMethod
        .findAll({ where: {
          CollectiveId: { $in: CollectiveIds },
          name: { $ne: null },
          archivedAt: null
        }})
        .then(results => sortResults(CollectiveIds, results, 'CollectiveId', []))
      )
    },
    transactions: {
      totalAmountForOrderId: new DataLoader(keys => models.Transaction.findAll({
          attributes: ['OrderId', [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'] ],
          where: { OrderId: { $in: keys } },
          group: ['OrderId']
        })
        .then(results => sortResults(keys, results, 'OrderId'))
        .map(result => get(result, 'dataValues.totalAmount') || 0)
      ),
      totalAmountDonatedFromTo: new DataLoader(keys => models.Transaction.findAll({
        attributes: ['FromCollectiveId', 'CollectiveId', [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'] ],
        where: {
          FromCollectiveId: { $in: keys.map(k => k.FromCollectiveId) },
          CollectiveId: { $in: keys.map(k => k.CollectiveId) },
          type: type.CREDIT
        },
        group: ['FromCollectiveId', 'CollectiveId']
      })
      .then(results => {
        const resultsByKey = {};
        results.forEach(r => {
          resultsByKey[`${r.FromCollectiveId}-${r.CollectiveId}`] = r.dataValues.totalAmount;
        });
        return keys.map(key => {
          return resultsByKey[`${key.FromCollectiveId}-${key.CollectiveId}`] || 0;
        })
      }))
    }
  }
};

export function middleware(req, res, next) {
    req.loaders = loaders(req);
    next();
}