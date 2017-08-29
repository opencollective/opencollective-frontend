import models, { sequelize } from '../models';
import { canAccessUserDetails } from '../lib/auth';
import { type } from '../constants/transactions';
import DataLoader from 'dataloader';
import Promise from 'bluebird';

const addAccessRights = (remoteUser, collectives) => {
  if (!remoteUser) return collectives;
  return Promise.map(collectives, collective => {
    return canAccessUserDetails(remoteUser.CollectiveId, collective.id)
      .then(canAccessUserDetails => {
        collective.canAccessUserDetails = canAccessUserDetails;
        return collective;
      });
  });
}

const sortResults = (keys, results, attribute = 'id') => {
  const resultsById = {};
  results.forEach(r => {
    const key = r.dataValues ? r.dataValues[attribute] : r[attribute];
    if (!key) {
      return;
    }
    resultsById[key] = r;
  });
  return keys.map(id => resultsById[id]); 
}

export const loaders = (req) => {
  return {
    collective: {
      byId: new DataLoader(ids => models.Collective
        .findAll({ where: { id: { $in: ids }}})
        .then(collectives => addAccessRights(req.remoteUser, collectives))
        .then(collectives => sortResults(ids, collectives))
      ),
      bySlug: new DataLoader(slugs => models.Collective.findAll({ where: { slug: { $in: slugs }}})
        .then(collectives => addAccessRights(req.remoteUser, collectives))
        .then(collectives => sortResults(slugs, collectives, 'slug'))
      ),
      getBalance: new DataLoader(ids => models.Transaction.findAll({
          attributes: [
            'ToCollectiveId',
            [ sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('netAmountInCollectiveCurrency')), 0), 'total' ]
          ],
          where: { ToCollectiveId: { $in: ids } },
          group: ['ToCollectiveId']
        })
        .then(results => sortResults(ids, results, 'ToCollectiveId'))
        .map(result => result.dataValues.totalAmount || 0)
      )
    },
    usersByCollectiveId: new DataLoader(keys => models.User.findAll({ where: { CollectiveId: { $in: keys } }})),
    tiers: new DataLoader(ids => models.Tier.findAll({ where: { id: { $in: ids }}})),
    transactions: {
      totalAmountForOrderId: new DataLoader(keys => models.Transaction.findAll({
          attributes: ['OrderId', [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'] ],
          where: { OrderId: { $in: keys } },
          group: ['OrderId']
        })
        .then(results => sortResults(keys, results, 'OrderId'))
        .map(result => result.dataValues.totalAmount || 0)
      ),
      totalAmountDonatedFromTo: new DataLoader(keys => models.Transaction.findAll({
        attributes: ['FromCollectiveId', 'ToCollectiveId', [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'] ],
        where: {
          FromCollectiveId: { $in: keys.map(k => k.FromCollectiveId) },
          ToCollectiveId: { $in: keys.map(k => k.ToCollectiveId) },
          type: type.DONATION
        },
        group: ['FromCollectiveId', 'ToCollectiveId']
      })
      .then(results => {
        const resultsByKey = {};
        results.forEach(r => {
          resultsByKey[`${r.FromCollectiveId}-${r.ToCollectiveId}`] = r.totalAmount;
        });
        return keys.map(key => {
          return resultsByKey[`${key.FromCollectiveId}-${key.ToCollectiveId}`] || 0;
        })
      }))
    }
  }
};

export function middleware(req, res, next) {
    req.loaders = loaders(req);
    next();
}