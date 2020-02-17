import DataLoader from 'dataloader';
import { createContext } from 'dataloader-sequelize';
import { get, groupBy } from 'lodash';

import { types as CollectiveType } from '../../constants/collectives';
import { maxInteger } from '../../constants/math';
import { TransactionTypes } from '../../constants/transactions';
import { getListOfAccessibleMembers } from '../../lib/auth';
import models, { Op, sequelize } from '../../models';
import { sortResults, createDataLoaderWithOptions } from './helpers';

// Loaders generators
import commentsLoader from './comments';
import conversationLoaders from './conversation';
import { generateExpenseAttachmentsLoader } from './expenses';
import { generateCollectivePaypalPayoutMethodsLoader, generateCollectivePayoutMethodsLoader } from './payout-method';
import { generateCanSeeUserPrivateInfoLoader } from './user';

export const loaders = req => {
  const cache = {};
  const context = createContext(sequelize);

  // Comment
  context.loaders.Comment.findAllByAttribute = commentsLoader.findAllByAttribute(req, cache);
  context.loaders.Comment.countByExpenseId = commentsLoader.countByExpenseId(req, cache);

  // Conversation
  context.loaders.Conversation.followers = conversationLoaders.followers(req, cache);
  context.loaders.Conversation.commentsCount = conversationLoaders.commentsCount(req, cache);

  // Expense
  context.loaders.ExpenseAttachment.byExpenseId = generateExpenseAttachmentsLoader(req, cache);

  // Payout method
  context.loaders.PayoutMethod.paypalByCollectiveId = generateCollectivePaypalPayoutMethodsLoader(req, cache);
  context.loaders.PayoutMethod.byCollectiveId = generateCollectivePayoutMethodsLoader(req, cache);

  // User
  context.loaders.User.canSeeUserPrivateInfo = generateCanSeeUserPrivateInfoLoader(req, cache);

  /** *** Collective *****/

  // Collective - ChildCollectives
  context.loaders.Collective.childCollectives = new DataLoader(parentIds =>
    models.Collective.findAll({
      where: { ParentCollectiveId: { [Op.in]: parentIds }, type: CollectiveType.COLLECTIVE },
    }).then(collectives => sortResults(parentIds, collectives, 'ParentCollectiveId', [])),
  );

  // Collective - Balance
  context.loaders.Collective.balance = new DataLoader(ids =>
    models.Transaction.findAll({
      attributes: [
        'CollectiveId',
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('netAmountInCollectiveCurrency')), 0), 'balance'],
      ],
      where: { CollectiveId: { [Op.in]: ids } },
      group: ['CollectiveId'],
    })
      .then(results => sortResults(ids, results, 'CollectiveId'))
      .map(result => get(result, 'dataValues.balance') || 0),
  );

  // Collective - ConnectedAccounts
  context.loaders.Collective.connectedAccounts = new DataLoader(ids =>
    models.ConnectedAccount.findAll({
      where: { CollectiveId: { [Op.in]: ids } },
    }).then(results => sortResults(ids, results, 'CollectiveId', [])),
  );

  /** Returns the collective if remote user has access to private infos or an empty object otherwise */
  context.loaders.Collective.privateInfos = new DataLoader(async collectives => {
    const allCollectiveIds = collectives.map(c => c.id);
    const accessibleCollectiveIdsList = await getListOfAccessibleMembers(req.remoteUser, allCollectiveIds);
    const accessibleCollectiveIdsSet = new Set(accessibleCollectiveIdsList);
    return collectives.map(collective => (accessibleCollectiveIdsSet.has(collective.id) ? collective : {}));
  });

  // Collective - Stats
  context.loaders.Collective.stats = {
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
      return models.Member.findAll({
        attributes: [
          'CollectiveId',
          'memberCollective.type',
          [sequelize.fn('COALESCE', sequelize.fn('COUNT', '*'), 0), 'count'],
        ],
        where: {
          CollectiveId: { [Op.in]: ids },
          role: 'BACKER',
        },
        include: {
          model: models.Collective,
          as: 'memberCollective',
          attributes: ['type'],
        },
        group: ['CollectiveId', 'memberCollective.type'],
        raw: true,
      })
        .then(rows => {
          const results = groupBy(rows, 'CollectiveId');
          return ids.map(id => {
            const result = get(results, id, []);
            const stats = result.reduce(
              (acc, value) => {
                acc.all += value.count;
                acc[value.type] = value.count;
                return acc;
              },
              { id, all: 0 },
            );
            return {
              CollectiveId: Number(id),
              ...stats,
            };
          });
        })
        .then(results => sortResults(ids, results, 'CollectiveId'));
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
  };

  // getUserDetailsByCollectiveId
  context.loaders.getUserDetailsByCollectiveId = new DataLoader(UserCollectiveIds =>
    getListOfAccessibleMembers(req.remoteUser, UserCollectiveIds)
      .then(accessibleUserCollectiveIds =>
        models.User.findAll({
          where: { CollectiveId: { [Op.in]: accessibleUserCollectiveIds } },
        }),
      )
      .then(results => sortResults(UserCollectiveIds, results, 'CollectiveId', {})),
  );

  // getOrgDetailsByCollectiveId
  context.loaders.getOrgDetailsByCollectiveId = new DataLoader(OrgCollectiveIds =>
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
  );

  /** *** Tier *****/
  // Tier - availableQuantity
  context.loaders.Tier.availableQuantity = new DataLoader(tierIds =>
    sequelize
      .query(
        `
          SELECT t.id, (t."maxQuantity" - COALESCE(SUM(o.quantity), 0)) AS "availableQuantity"
          FROM "Tiers" t
          LEFT JOIN "Orders" o ON o."TierId" = t.id AND o."processedAt" IS NOT NULL
          WHERE t.id IN (?)
          AND t."maxQuantity" IS NOT NULL
          GROUP BY t.id
        `,
        {
          replacements: [tierIds],
          type: sequelize.QueryTypes.SELECT,
        },
      )
      .then(results => {
        return tierIds.map(tierId => {
          const result = results.find(({ id }) => id === tierId);
          return result ? result.availableQuantity : maxInteger;
        });
      }),
  );
  // Tier - totalDistinctOrders
  context.loaders.Tier.totalDistinctOrders = new DataLoader(ids =>
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
  );

  // Tier - totalOrders
  context.loaders.Tier.totalOrders = new DataLoader(ids =>
    models.Order.findAll({
      attributes: ['TierId', [sequelize.fn('COALESCE', sequelize.fn('COUNT', sequelize.col('id')), 0), 'count']],
      where: { TierId: { [Op.in]: ids }, processedAt: { [Op.ne]: null } },
      group: ['TierId'],
    })
      .then(results => sortResults(ids, results, 'TierId'))
      .map(result => get(result, 'dataValues.count') || 0),
  );

  // Tier - totalActiveDistinctOrders
  context.loaders.Tier.totalActiveDistinctOrders = new DataLoader(ids =>
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
  );

  // Tier - totalDonated
  context.loaders.Tier.totalDonated = new DataLoader(ids =>
    sequelize
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
      .then(results => sortResults(ids, results, 'TierId').map(result => (result ? result.totalDonated : 0))),
  );

  // Tier - totalMonthlyDonations
  context.loaders.Tier.totalMonthlyDonations = new DataLoader(ids =>
    sequelize
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
      .then(results => sortResults(ids, results, 'TierId').map(result => (result ? result.total : 0))),
  );

  // Tier - totalYearlyDonations
  context.loaders.Tier.totalYearlyDonations = new DataLoader(ids =>
    sequelize
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
      .then(results => sortResults(ids, results, 'TierId').map(result => (result ? result.total : 0))),
  );

  // Tier - contributorsStats
  context.loaders.Tier.contributorsStats = new DataLoader(tiersIds =>
    models.Member.findAll({
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
      return tiersIds.map(tierId => resultsMap[tierId] || getDefaultStats(tierId));
    }),
  );

  /** *** PaymentMethod *****/
  // PaymentMethod - findByCollectiveId
  context.loaders.PaymentMethod.findByCollectiveId = new DataLoader(CollectiveIds =>
    models.PaymentMethod.findAll({
      where: {
        CollectiveId: { [Op.in]: CollectiveIds },
        name: { [Op.ne]: null },
        expiryDate: { [Op.or]: [null, { [Op.gte]: new Date() }] },
        archivedAt: null,
      },
      order: [['id', 'DESC']],
    }).then(results => sortResults(CollectiveIds, results, 'CollectiveId', [])),
  );

  /** *** Order *****/
  // Order - findByMembership
  context.loaders.Order.findByMembership = new DataLoader(combinedKeys =>
    models.Order.findAll({
      where: {
        CollectiveId: { [Op.in]: combinedKeys.map(k => k.split(':')[0]) },
        FromCollectiveId: {
          [Op.in]: combinedKeys.map(k => k.split(':')[1]),
        },
      },
      order: [['createdAt', 'DESC']],
    }).then(results => sortResults(combinedKeys, results, 'CollectiveId:FromCollectiveId', [])),
  );

  // Order - findPendingOrdersForCollective
  context.loaders.Order.findPendingOrdersForCollective = new DataLoader(CollectiveIds =>
    models.Order.findAll({
      where: {
        CollectiveId: { [Op.in]: CollectiveIds },
        status: 'PENDING',
      },
      order: [['createdAt', 'DESC']],
    }).then(results => sortResults(CollectiveIds, results, 'CollectiveId', [])),
  );

  // Order - stats
  context.loaders.Order.stats = {
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
  };

  /** *** Member *****/
  /* context.loaders.Member.findByTierId = new DataLoader(tiersIds =>
    models.Member.findAll({
      where: { TierId: { [Op.in]: tiersIds } },
      order: [['createdAt', 'DESC']],
    }).then(results => sortResults(tiersIds, results, 'TierId', []))
  ); */

  context.loaders.Member.transactions = new DataLoader(combinedKeys =>
    models.Transaction.findAll({
      where: {
        CollectiveId: { [Op.in]: combinedKeys.map(k => k.split(':')[0]) },
        FromCollectiveId: {
          [Op.in]: combinedKeys.map(k => k.split(':')[1]),
        },
      },
      order: [['createdAt', 'DESC']],
    }).then(results => sortResults(combinedKeys, results, 'CollectiveId:FromCollectiveId', [])),
  );

  /** *** Transaction *****/
  context.loaders.Transaction = {
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
        cache,
        options,
        'transactions',
      ),
    directDonationsFromTo: new DataLoader(keys =>
      models.Transaction.findAll({
        attributes: ['FromCollectiveId', 'CollectiveId', [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']],
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
  };

  return context.loaders;
};

export function loadersMiddleware(req, res, next) {
  req.loaders = loaders(req);
  next();
}
