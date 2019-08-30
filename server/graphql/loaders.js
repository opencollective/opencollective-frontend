import models, { sequelize, Op } from '../models';
import { getListOfAccessibleMembers } from '../lib/auth';
import { TransactionTypes } from '../constants/transactions';
import DataLoader from 'dataloader';
import dataloaderSequelize from 'dataloader-sequelize';
import { get, groupBy } from 'lodash';
import debugLib from 'debug';

dataloaderSequelize(models.Order);
dataloaderSequelize(models.Transaction);
dataloaderSequelize(models.Collective);
dataloaderSequelize(models.Expense);

const debug = debugLib('loaders');

const sortResults = (keys, results, attribute = 'id', defaultValue) => {
  debug('sortResults', attribute, 'number of results:', results.length);
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
      key = get(dataValues, attribute);
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
};

export const loaders = req => {
  const cache = {};

  const createDataLoaderWithOptions = (batchFunction, options = {}, cacheKeyPrefix = '') => {
    const cacheKey = `${cacheKeyPrefix}:${JSON.stringify(options)}`;
    cache[cacheKey] = cache[cacheKey] || new DataLoader(keys => batchFunction(keys, options));
    return cache[cacheKey];
  };

  return {
    collective: {
      findById: new DataLoader(ids =>
        models.Collective.findAll({ where: { id: { [Op.in]: ids } } }).then(collectives =>
          sortResults(ids, collectives),
        ),
      ),
      balance: new DataLoader(ids =>
        models.Transaction.findAll({
          attributes: [
            'CollectiveId',
            [
              sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('netAmountInCollectiveCurrency')), 0),
              'balance',
            ],
          ],
          where: { CollectiveId: { [Op.in]: ids } },
          group: ['CollectiveId'],
        })
          .then(results => sortResults(ids, results, 'CollectiveId'))
          .map(result => get(result, 'dataValues.balance') || 0),
      ),
      connectedAccounts: new DataLoader(ids =>
        models.ConnectedAccount.findAll({
          where: { CollectiveId: { [Op.in]: ids } },
        }).then(results => sortResults(ids, results, 'CollectiveId', [])),
      ),
      stats: {
        collectives: new DataLoader(ids =>
          models.Collective.findAll({
            attributes: [
              'HostCollectiveId',
              [sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count'],
            ],
            where: { HostCollectiveId: { [Op.in]: ids } },
            group: ['HostCollectiveId'],
          })
            .then(results => sortResults(ids, results, 'TierId'))
            .map(result => get(result, 'dataValues.count') || 0),
        ),
        backers: new DataLoader(ids => {
          const query = {
            attributes: [
              'CollectiveId',
              'UsingVirtualCardFromCollectiveId',
              [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('FromCollectiveId'))), 'count'],
            ],
            where: {
              CollectiveId: { [Op.in]: ids },
              type: 'CREDIT',
            },
            include: [
              {
                model: models.Collective,
                as: 'fromCollective',
                attributes: ['id', 'type'],
                required: true,
              },
              {
                model: models.Collective,
                as: 'usingVirtualCardFromCollective',
                attributes: ['type'],
                required: false,
              },
            ],
            group: [
              'CollectiveId',
              'UsingVirtualCardFromCollectiveId',
              'usingVirtualCardFromCollective.type',
              'fromCollective.id',
              'fromCollective.type',
            ],
            raw: true, // need this otherwise it automatically also fetches Transaction.id which messes up everything
          };

          const fromCollectiveIdKey = 'fromCollective.id';
          const fromCollectiveTypeKey = 'fromCollective.type';
          const vcEmitterCollectiveTypeKey = 'usingVirtualCardFromCollective.type';
          return models.Transaction.findAll(query)
            .then(results => sortResults(ids, results, 'CollectiveId', []))
            .map(result => {
              const stats = { all: 0 };
              const countedCollectiveIds = [];
              const addToStats = (type, collectiveId, count) => {
                // Ensure we only count a collective one time
                if (!countedCollectiveIds.includes(collectiveId)) {
                  stats[type] = (stats[type] || 0) + count;
                  stats.all += count;
                  countedCollectiveIds.push(collectiveId);
                }
              };

              result.forEach(r => {
                stats.id = r.CollectiveId;
                if (r.UsingVirtualCardFromCollectiveId) {
                  addToStats(r[vcEmitterCollectiveTypeKey], r.UsingVirtualCardFromCollectiveId, r.count);
                }
                addToStats(r[fromCollectiveTypeKey], r[fromCollectiveIdKey], r.count);
              });
              return stats;
            });
        }),
        expenses: new DataLoader(ids =>
          models.Expense.findAll({
            attributes: [
              'CollectiveId',
              'status',
              [sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count'],
            ],
            where: { CollectiveId: { [Op.in]: ids } },
            group: ['CollectiveId', 'status'],
          })
            .then(rows => {
              const results = groupBy(rows, 'CollectiveId');
              return Object.keys(results).map(CollectiveId => {
                const stats = {};
                results[CollectiveId].map(e => e.dataValues).map(stat => {
                  stats[stat.status] = stat.count;
                });
                return {
                  CollectiveId: Number(CollectiveId),
                  ...stats,
                };
              });
            })
            .then(results => sortResults(ids, results, 'CollectiveId')),
        ),
      },
    },
    // This one is tricky. We need to make sure that the remoteUser can view the personal details of the user.
    getUserDetailsByCollectiveId: new DataLoader(UserCollectiveIds =>
      getListOfAccessibleMembers(req.remoteUser, UserCollectiveIds)
        .then(accessibleUserCollectiveIds =>
          models.User.findAll({
            where: { CollectiveId: { [Op.in]: accessibleUserCollectiveIds } },
          }),
        )
        .then(results => sortResults(UserCollectiveIds, results, 'CollectiveId', {})),
    ),
    getOrgDetailsByCollectiveId: new DataLoader(OrgCollectiveIds =>
      getListOfAccessibleMembers(req.remoteUser, OrgCollectiveIds)
        .then(accessibleOrgCollectiveIds =>
          models.Collective.findAll({
            attributes: ['id', 'CreatedByUserId'],
            where: { id: { [Op.in]: accessibleOrgCollectiveIds } },
          }),
        )
        .then(accessibleOrgCollectives => {
          const accessibleOrgCreators = {};
          accessibleOrgCollectives.map(c => {
            if (c.CreatedByUserId) {
              accessibleOrgCreators[c.CreatedByUserId] = c.id;
            }
          });
          return accessibleOrgCreators;
        })
        .then(accessibleOrgCreators => {
          return models.User.findAll({
            attributes: ['id', 'CollectiveId', 'email'],
            where: { id: { [Op.in]: Object.keys(accessibleOrgCreators) } },
          }).map(u => {
            u.dataValues.OrgCollectiveId = accessibleOrgCreators[u.id];
            return u;
          });
        })
        .catch(e => {
          console.error(e);
          return [];
        })
        .then(results => sortResults(OrgCollectiveIds, results, 'OrgCollectiveId', {})),
    ),
    comments: {
      findAllByAttribute: attribute =>
        createDataLoaderWithOptions(
          (values, attribute) => {
            return models.Comment.findAll({
              where: {
                [attribute]: { [Op.in]: values },
              },
              order: [['createdAt', 'DESC']],
            }).then(results => sortResults(values, results, attribute, []));
          },
          attribute,
          'comments',
        ),
      countByExpenseId: new DataLoader(ExpenseIds =>
        models.Comment.count({
          attributes: ['ExpenseId'],
          where: { ExpenseId: { [Op.in]: ExpenseIds } },
          group: ['ExpenseId'],
        })
          .then(results => sortResults(ExpenseIds, results, 'ExpenseId'))
          .map(result => result.count),
      ),
    },
    tiers: {
      findById: new DataLoader(ids =>
        models.Tier.findAll({ where: { id: { [Op.in]: ids } } }).then(results => sortResults(ids, results, 'id')),
      ),
      totalDistinctOrders: new DataLoader(ids =>
        models.Order.findAll({
          attributes: [
            'TierId',
            [
              sequelize.fn(
                'COALESCE',
                sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('FromCollectiveId'))),
                0,
              ),
              'count',
            ],
          ],
          where: { TierId: { [Op.in]: ids } },
          group: ['TierId'],
        })
          .then(results => sortResults(ids, results, 'TierId'))
          .map(result => get(result, 'dataValues.count') || 0),
      ),
      totalOrders: new DataLoader(ids =>
        models.Order.findAll({
          attributes: ['TierId', [sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count']],
          where: { TierId: { [Op.in]: ids }, processedAt: { [Op.ne]: null } },
          group: ['TierId'],
        })
          .then(results => sortResults(ids, results, 'TierId'))
          .map(result => get(result, 'dataValues.count') || 0),
      ),
      totalActiveDistinctOrders: new DataLoader(ids =>
        models.Order.findAll({
          attributes: [
            'TierId',
            [
              sequelize.fn(
                'COALESCE',
                sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('FromCollectiveId'))),
                0,
              ),
              'count',
            ],
          ],
          where: { TierId: { [Op.in]: ids }, processedAt: { [Op.ne]: null }, status: { [Op.in]: ['ACTIVE', 'PAID'] } },
          group: ['TierId'],
        })
          .then(results => sortResults(ids, results, 'TierId'))
          .map(result => get(result, 'dataValues.count') || 0),
      ),
      totalDonated: new DataLoader(ids => {
        return sequelize
          .query(
            `
            SELECT "Order"."TierId" AS "TierId", COALESCE(SUM("Transaction"."netAmountInCollectiveCurrency"), 0) AS "totalDonated"
            FROM "Transactions" AS "Transaction"
            INNER JOIN "Orders" AS "Order" ON "Transaction"."OrderId" = "Order"."id" AND ("Order"."deletedAt" IS NULL)
            WHERE "TierId" IN (?)
            AND "Transaction"."deletedAt" IS NULL
            AND "Transaction"."RefundTransactionId" IS NULL
            AND "Transaction"."type" = 'CREDIT'
            GROUP BY "TierId";
          `,
            {
              replacements: [ids],
              type: sequelize.QueryTypes.SELECT,
            },
          )
          .then(results => {
            return sortResults(ids, results, 'TierId').map(result => {
              return result ? result.totalDonated : 0;
            });
          });
      }),
      totalMonthlyDonations: new DataLoader(ids => {
        return sequelize
          .query(
            `
            SELECT o."TierId" AS "TierId", COALESCE(SUM(s."amount"), 0) AS "total"
            FROM "Orders" o
            INNER JOIN "Subscriptions" s ON o."SubscriptionId" = s.id
            WHERE "TierId" IN (?)
            AND s."isActive" = TRUE
            AND s."interval" = 'month'
            GROUP BY "TierId";
          `,
            {
              replacements: [ids],
              type: sequelize.QueryTypes.SELECT,
            },
          )
          .then(results => {
            return sortResults(ids, results, 'TierId').map(result => {
              return result ? result.total : 0;
            });
          });
      }),
      totalYearlyDonations: new DataLoader(ids => {
        return sequelize
          .query(
            `
            SELECT o."TierId" AS "TierId", COALESCE(SUM(s."amount"), 0) AS "total"
            FROM "Orders" o
            INNER JOIN "Subscriptions" s ON o."SubscriptionId" = s.id
            WHERE "TierId" IN (?)
            AND s."isActive" = TRUE
            AND s."interval" = 'year'
            GROUP BY "TierId";
          `,
            {
              replacements: [ids],
              type: sequelize.QueryTypes.SELECT,
            },
          )
          .then(results => {
            return sortResults(ids, results, 'TierId').map(result => {
              return result ? result.total : 0;
            });
          });
      }),
      contributorsStats: new DataLoader(tiersIds => {
        return models.Member.findAll({
          attributes: [
            'TierId',
            sequelize.col('memberCollective.type'),
            [sequelize.fn('COUNT', sequelize.col('memberCollective.id')), 'count'],
          ],
          where: {
            TierId: { [Op.in]: tiersIds },
          },
          group: ['TierId', sequelize.col('memberCollective.type')],
          include: [
            {
              model: models.Collective,
              as: 'memberCollective',
              attributes: [],
              required: true,
            },
          ],
          raw: true,
        }).then(results => {
          // Used to initialize stats or for when there's no entry available
          const getDefaultStats = TierId => ({
            id: TierId,
            all: 0,
            USER: 0,
            ORGANIZATION: 0,
            COLLECTIVE: 0,
          });

          // Build a map like { 42: { id: 42, users: 12, ... } }
          const resultsMap = {};
          results.forEach(({ TierId, type, count }) => {
            if (!resultsMap[TierId]) {
              resultsMap[TierId] = getDefaultStats(TierId);
            }

            resultsMap[TierId][type] = count;
            resultsMap[TierId].all += count;
          });

          // Return a sorted list to match dataloader format
          return tiersIds.map(tierId => {
            return resultsMap[tierId] || getDefaultStats(tierId);
          });
        });
      }),
    },
    paymentMethods: {
      findById: new DataLoader(ids =>
        models.PaymentMethod.findAll({ where: { id: { [Op.in]: ids } } }).then(results =>
          sortResults(ids, results, 'id'),
        ),
      ),
      findByCollectiveId: new DataLoader(CollectiveIds =>
        models.PaymentMethod.findAll({
          where: {
            CollectiveId: { [Op.in]: CollectiveIds },
            name: { [Op.ne]: null },
            expiryDate: { [Op.or]: [null, { [Op.gte]: new Date() }] },
            archivedAt: null,
          },
          order: [['id', 'DESC']],
        }).then(results => sortResults(CollectiveIds, results, 'CollectiveId', [])),
      ),
    },
    orders: {
      findByMembership: new DataLoader(combinedKeys =>
        models.Order.findAll({
          where: {
            CollectiveId: { [Op.in]: combinedKeys.map(k => k.split(':')[0]) },
            FromCollectiveId: {
              [Op.in]: combinedKeys.map(k => k.split(':')[1]),
            },
          },
          order: [['createdAt', 'DESC']],
        }).then(results => sortResults(combinedKeys, results, 'CollectiveId:FromCollectiveId', [])),
      ),
      findPendingOrdersForCollective: new DataLoader(CollectiveIds => {
        return models.Order.findAll({
          where: {
            CollectiveId: { [Op.in]: CollectiveIds },
            status: 'PENDING',
          },
          order: [['createdAt', 'DESC']],
        }).then(results => {
          return sortResults(CollectiveIds, results, 'CollectiveId', []);
        });
      }),
      stats: {
        transactions: new DataLoader(ids =>
          models.Transaction.findAll({
            attributes: ['OrderId', [sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count']],
            where: { OrderId: { [Op.in]: ids } },
            group: ['OrderId'],
          })
            .then(results => sortResults(ids, results, 'OrderId'))
            .map(result => get(result, 'dataValues.count') || 0),
        ),
        totalTransactions: new DataLoader(keys =>
          models.Transaction.findAll({
            attributes: ['OrderId', [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']],
            where: { OrderId: { [Op.in]: keys } },
            group: ['OrderId'],
          })
            .then(results => sortResults(keys, results, 'OrderId'))
            .map(result => get(result, 'dataValues.totalAmount') || 0),
        ),
      },
    },
    members: {
      findByTierId: new DataLoader(tiersIds => {
        return models.Member.findAll({
          where: { TierId: { [Op.in]: tiersIds } },
          order: [['createdAt', 'DESC']],
        }).then(results => {
          return sortResults(tiersIds, results, 'TierId', []);
        });
      }),
      transactions: new DataLoader(combinedKeys =>
        models.Transaction.findAll({
          where: {
            CollectiveId: { [Op.in]: combinedKeys.map(k => k.split(':')[0]) },
            FromCollectiveId: {
              [Op.in]: combinedKeys.map(k => k.split(':')[1]),
            },
          },
          order: [['createdAt', 'DESC']],
        }).then(results => sortResults(combinedKeys, results, 'CollectiveId:FromCollectiveId', [])),
      ),
    },
    transactions: {
      findByOrderId: options =>
        createDataLoaderWithOptions(
          (OrderIds, options) => {
            return models.Transaction.findAll({
              where: {
                OrderId: { [Op.in]: OrderIds },
                ...options.where,
              },
              order: [['createdAt', 'DESC']],
            }).then(results => sortResults(OrderIds, results, 'OrderId', []));
          },
          options,
          'transactions',
        ),
      directDonationsFromTo: new DataLoader(keys =>
        models.Transaction.findAll({
          attributes: [
            'FromCollectiveId',
            'CollectiveId',
            [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
          ],
          where: {
            FromCollectiveId: { [Op.in]: keys.map(k => k.FromCollectiveId) },
            CollectiveId: { [Op.in]: keys.map(k => k.CollectiveId) },
            type: TransactionTypes.CREDIT,
          },
          group: ['FromCollectiveId', 'CollectiveId'],
        }).then(results => {
          const resultsByKey = {};
          results.forEach(r => {
            resultsByKey[`${r.FromCollectiveId}-${r.CollectiveId}`] = r.dataValues.totalAmount;
          });
          return keys.map(key => {
            return resultsByKey[`${key.FromCollectiveId}-${key.CollectiveId}`] || 0;
          });
        }),
      ),
      donationsThroughEmittedVirtualCardsFromTo: new DataLoader(keys =>
        models.Transaction.findAll({
          attributes: [
            'UsingVirtualCardFromCollectiveId',
            'CollectiveId',
            [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
          ],
          where: {
            UsingVirtualCardFromCollectiveId: {
              [Op.in]: keys.map(k => k.FromCollectiveId),
            },
            CollectiveId: { [Op.in]: keys.map(k => k.CollectiveId) },
            type: TransactionTypes.CREDIT,
          },
          group: ['UsingVirtualCardFromCollectiveId', 'CollectiveId'],
        }).then(results => {
          const resultsByKey = {};
          results.forEach(r => {
            resultsByKey[`${r.UsingVirtualCardFromCollectiveId}-${r.CollectiveId}`] = r.dataValues.totalAmount;
          });
          return keys.map(key => {
            return resultsByKey[`${key.FromCollectiveId}-${key.CollectiveId}`] || 0;
          });
        }),
      ),
      totalAmountDonatedFromTo: new DataLoader(keys =>
        models.Transaction.findAll({
          attributes: [
            'FromCollectiveId',
            'UsingVirtualCardFromCollectiveId',
            'CollectiveId',
            [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
          ],
          where: {
            [Op.or]: {
              FromCollectiveId: {
                [Op.in]: keys.map(k => k.FromCollectiveId),
              },
              UsingVirtualCardFromCollectiveId: {
                [Op.in]: keys.map(k => k.FromCollectiveId),
              },
            },
            CollectiveId: { [Op.in]: keys.map(k => k.CollectiveId) },
            type: TransactionTypes.CREDIT,
          },
          group: ['FromCollectiveId', 'UsingVirtualCardFromCollectiveId', 'CollectiveId'],
        }).then(results => {
          const resultsByKey = {};
          results.forEach(({ CollectiveId, FromCollectiveId, UsingVirtualCardFromCollectiveId, dataValues }) => {
            // Credit collective that emitted the virtual card (if any)
            if (UsingVirtualCardFromCollectiveId) {
              const key = `${UsingVirtualCardFromCollectiveId}-${CollectiveId}`;
              const donated = resultsByKey[key] || 0;
              resultsByKey[key] = donated + dataValues.totalAmount;
            }
            // Credit collective who actually made the transaction
            const key = `${FromCollectiveId}-${CollectiveId}`;
            const donated = resultsByKey[key] || 0;
            resultsByKey[key] = donated + dataValues.totalAmount;
          });
          return keys.map(key => {
            return resultsByKey[`${key.FromCollectiveId}-${key.CollectiveId}`] || 0;
          });
        }),
      ),
    },
  };
};

export function loadersMiddleware(req, res, next) {
  req.loaders = loaders(req);
  next();
}
