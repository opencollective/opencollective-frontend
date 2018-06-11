import models, { sequelize, Op } from '../models';
import { getListOfAccessibleMembers } from '../lib/auth';
import { TransactionTypes } from '../constants/transactions';
import DataLoader from 'dataloader';
import { get, groupBy } from 'lodash';
import debugLib from 'debug';
const debug = debugLib('loaders');

const sortResults = (keys, results, attribute = 'id', defaultValue) => {
  debug("sortResults", attribute, results.length);
  const resultsById = {};
  results.forEach(r => {
    let key;
    const dataValues = r.dataValues || r;
    if (attribute.indexOf(':') !== -1) {
      const keyComponents = [];
      attribute.split(':').forEach(attr => {
        keyComponents.push(dataValues[attr]);
      });
      key = keyComponents.join(':');
    } else {
      key = dataValues[attribute];
    }
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

  const cache = {};
  const createDataLoaderWithOptions = (batchFunction, options = {}) => {
    const cacheKey = JSON.stringify(options);
    cache[cacheKey] = cache[cacheKey] || new DataLoader(keys => batchFunction(keys, options));
    return cache[cacheKey];
  }

  return {
    collective: {
      findById: new DataLoader(ids => models.Collective
        .findAll({ where: { id: { [Op.in]: ids }}})
        .then(collectives => sortResults(ids, collectives))
      ),
      balance: new DataLoader(ids => models.Transaction.findAll({
          attributes: [
            'CollectiveId',
            [ sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('netAmountInCollectiveCurrency')), 0), 'balance' ]
          ],
          where: { CollectiveId: { [Op.in]: ids } },
          group: ['CollectiveId']
        })
        .then(results => sortResults(ids, results, 'CollectiveId'))
        .map(result => get(result, 'dataValues.balance') || 0)
      ),
      connectedAccounts: new DataLoader(ids => models.ConnectedAccount.findAll({
          where: { CollectiveId: { [Op.in]: ids } }
        })
        .then(results => sortResults(ids, results, 'CollectiveId', []))
      ),
      stats: {
        collectives: new DataLoader(ids => models.Collective.findAll({
            attributes: [
              'HostCollectiveId',
              [ sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count' ]
            ],
            where: { HostCollectiveId: { [Op.in]: ids } },
            group: ['HostCollectiveId']
          })
          .then(results => sortResults(ids, results, 'TierId'))
          .map(result => get(result, 'dataValues.count') || 0)
        ),
        backers: new DataLoader(ids => {
          const query = {
            attributes: [
              'CollectiveId',
              [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('FromCollectiveId'))), 'count']
            ],
            where: {
              CollectiveId: { [Op.in]: ids },
              type: 'CREDIT'
            }
          };
          query.attributes.push('fromCollective.type');
          query.include = [
            {
              model: models.Collective,
              as: 'fromCollective',
              attributes: [],
              required: true
            }
          ];
          query.raw = true; // need this otherwise it automatically also fetches Transaction.id which messes up everything
          query.group = ['fromCollective.type', 'CollectiveId'];

          return models.Transaction.findAll(query)
          .then(results => sortResults(ids, results, 'CollectiveId', []))
          .map(result => {
            const stats = { all: 0 };
            result.forEach(r => {
              stats.id = r.CollectiveId;
              stats[r.type] = r.count;
              stats.all += r.count;
            })
            return stats;
          })
        }

        ),
        expenses: new DataLoader(ids => models.Expense.findAll({
          attributes: [
            'CollectiveId',
            'status',
            [ sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count' ]
          ],
          where: { CollectiveId: { [Op.in]: ids } },
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
    getUserDetailsByCollectiveId: new DataLoader(UserCollectiveIds => getListOfAccessibleMembers(req.remoteUser, UserCollectiveIds)
      .then(accessibleUserCollectiveIds => models.User.findAll({ where: { CollectiveId: { [Op.in]: accessibleUserCollectiveIds } }}))
      .then(results => sortResults(UserCollectiveIds, results, 'CollectiveId', {}))
    ),
    getOrgDetailsByCollectiveId: new DataLoader(OrgCollectiveIds => getListOfAccessibleMembers(req.remoteUser, OrgCollectiveIds)
      .then(accessibleOrgCollectiveIds => models.Collective.findAll({ attributes: ['id', 'CreatedByUserId'], where: { id: { [Op.in]: accessibleOrgCollectiveIds } }})).then(accessibleOrgCollectives => {
        const accessibleOrgCreators = {};
        accessibleOrgCollectives.map(c => {
          if (c.CreatedByUserId) {
            accessibleOrgCreators[c.CreatedByUserId] = c.id;
          }
        })
        return accessibleOrgCreators;
      })
      .then(accessibleOrgCreators => {
        return models.User.findAll({ attributes: ['id', 'CollectiveId', 'email'], where: { id: { [Op.in]: Object.keys(accessibleOrgCreators) } }})
          .map(u => {
            u.dataValues.OrgCollectiveId = accessibleOrgCreators[u.id];
            return u;
          })
      })
      .catch(e => {
        console.error(e);
        return [];
      })
      .then(results => sortResults(OrgCollectiveIds, results, 'OrgCollectiveId', {}))
    ),
    tiers: {
      findById: new DataLoader(ids => models.Tier
        .findAll({ where: { id: { [Op.in]: ids }}})
        .then(results => sortResults(ids, results, 'id'))
      ),
      totalDistinctOrders: new DataLoader(ids => models.Order.findAll({
          attributes: [
            'TierId',
            [ sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('FromCollectiveId'))), 0), 'count' ]
          ],
          where: { TierId: { [Op.in]: ids } },
          group: ['TierId']
        })
        .then(results => sortResults(ids, results, 'TierId'))
        .map(result => get(result, 'dataValues.count') || 0)
      ),
      totalOrders: new DataLoader(ids => models.Order.findAll({
          attributes: [
            'TierId',
            [ sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count' ]
          ],
          where: { TierId: { [Op.in]: ids }, processedAt: { [Op.ne]: null } },
          group: ['TierId']
        })
        .then(results => sortResults(ids, results, 'TierId'))
        .map(result => get(result, 'dataValues.count') || 0)
      )
    },
    paymentMethods: {
      findById: new DataLoader(ids => models.PaymentMethod
        .findAll({ where: { id: { [Op.in]: ids }}})
        .then(results => sortResults(ids, results, 'id'))
      ),
      findByCollectiveId: new DataLoader(CollectiveIds => models.PaymentMethod
        .findAll({ where: {
          CollectiveId: { [Op.in]: CollectiveIds },
          name: { [Op.ne]: null },
          expiryDate: { [Op.or]: [ null, { [Op.gte]: new Date } ] },
          archivedAt: null
        }})
        .then(results => sortResults(CollectiveIds, results, 'CollectiveId', []))
      )
    },
    orders: {
      findByMembership: new DataLoader(combinedKeys => models.Order
          .findAll({
            where: {
              CollectiveId: { [Op.in]: combinedKeys.map(k => k.split(':')[0]) },
              FromCollectiveId: { [Op.in]: combinedKeys.map(k => k.split(':')[1] )}
            },
            order: [['createdAt', 'DESC']]
          })
          .then(results => sortResults(combinedKeys, results, 'CollectiveId:FromCollectiveId', []))
      ),
      stats: {
        transactions: new DataLoader(ids => models.Transaction.findAll({
            attributes: [
              'OrderId',
              [ sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count' ]
            ],
            where: { OrderId: { [Op.in]: ids } },
            group: ['OrderId']
          })
          .then(results => sortResults(ids, results, 'OrderId'))
          .map(result => get(result, 'dataValues.count') || 0)
        ),
        totalTransactions: new DataLoader(keys => models.Transaction.findAll({
            attributes: ['OrderId', [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'] ],
            where: { OrderId: { [Op.in]: keys } },
            group: ['OrderId']
          })
          .then(results => sortResults(keys, results, 'OrderId'))
          .map(result => get(result, 'dataValues.totalAmount') || 0)
        )
      }
    },
    members: {
      transactions: new DataLoader(combinedKeys => models.Transaction
          .findAll({
            where: {
              CollectiveId: { [Op.in]: combinedKeys.map(k => k.split(':')[0]) },
              FromCollectiveId: { [Op.in]: combinedKeys.map(k => k.split(':')[1] )}
            },
            order: [['createdAt', 'DESC']]
          })
          .then(results => sortResults(combinedKeys, results, 'CollectiveId:FromCollectiveId', []))
        ),
      totalAmountRaised: new DataLoader(keys => models.Order.findAll({
        attributes: ['ReferralCollectiveId', 'CollectiveId', [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount'] ],
        where: {
          ReferralCollectiveId: { [Op.in]: keys.map(k => k.ReferralCollectiveId) },
          CollectiveId: { [Op.in]: keys.map(k => k.CollectiveId) }
        },
        group: ['ReferralCollectiveId', 'CollectiveId']
      })
      .then(results => {
        const resultsByKey = {};
        results.forEach(r => {
          resultsByKey[`${r.ReferralCollectiveId}-${r.CollectiveId}`] = r.dataValues.totalAmount;
        });
        return keys.map(key => {
          return resultsByKey[`${key.ReferralCollectiveId}-${key.CollectiveId}`] || 0;
        })
      }))
    },
    transactions: {
      findByOrderId: options => createDataLoaderWithOptions((OrderIds, options) => {
        return models.Transaction
          .findAll({
            where: {
              OrderId: { [Op.in]: OrderIds },
              ... options.where
            },
            order: [['createdAt', 'DESC']]
          })
          .then(results => sortResults(OrderIds, results, 'OrderId', []))
        }, options),
      totalAmountDonatedFromTo: new DataLoader(keys => models.Transaction.findAll({
        attributes: ['FromCollectiveId', 'CollectiveId', [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'] ],
        where: {
          FromCollectiveId: { [Op.in]: keys.map(k => k.FromCollectiveId) },
          CollectiveId: { [Op.in]: keys.map(k => k.CollectiveId) },
          type: TransactionTypes.CREDIT
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
