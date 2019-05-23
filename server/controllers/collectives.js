import config from 'config';
import prependHttp from 'prepend-http';

import queries from '../lib/queries';
import models, { Op } from '../models';
import { resizeImage } from '../lib/utils';

const _getUsersData = (collective, tier) => {
  return collective.getSuperCollectiveCollectivesIds().then(ids => {
    if (tier === 'backers') {
      return queries
        .getMembersWithTotalDonations({ CollectiveId: ids, role: 'BACKER' })
        .then(backerCollectives => models.Tier.appendTier(collective, backerCollectives));
    } else {
      return queries
        .getMembersOfCollectiveWithRole(ids)
        .then(backerCollectives => models.Tier.appendTier(collective, backerCollectives));
    }
  });
};

export const getUsers = (req, res, next) => {
  let promise = _getUsersData(req.collective, req.params.tierSlug);

  if (req.query.filter && req.query.filter === 'active') {
    const activeUsersByCollectiveId = {};
    promise = promise.then(userCollectives => {
      const UserCollectiveIds = userCollectives.map(u => u.id);
      return models.Order.findAll({
        where: { FromCollectiveId: { [Op.in]: UserCollectiveIds } },
        include: [{ model: models.Subscription, where: { isActive: true } }],
      }).then(orders => {
        orders.map(o => {
          activeUsersByCollectiveId[o.FromCollectiveId] = Boolean(o.Subscription && o.Subscription.isActive);
        });
        return userCollectives.filter(u => activeUsersByCollectiveId[u.id]);
      });
    });
  }

  return promise
    .map(userCollective => {
      let avatar = resizeImage(userCollective.image, { height: 96 });
      if (avatar && avatar.match(/^\//)) {
        avatar = `${config.host.website}${avatar}`;
      }
      const u = {
        ...userCollective.dataValues,
        tier: userCollective.tier && userCollective.tier.slug,
        avatar,
      };
      delete u.image;
      if (!u.tier) {
        u.tier = u.type === 'USER' ? 'backer' : 'sponsor';
      }
      if (!req.collective || !req.remoteUser || !req.remoteUser.isAdmin(req.collective.id)) {
        delete u.email;
      }
      if (u.website) {
        u.website = prependHttp(u.website);
      }
      return u;
    })
    .then(users => res.send(users))
    .catch(next);
};
