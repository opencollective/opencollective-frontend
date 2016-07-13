const groupBy = require('lodash/collection/groupBy');
const roles = require('../constants/roles');
const utils = require('../lib/utils');

/**
 * Controller.
 */
module.exports = function(app) {

  const models = app.set('models');
  const queries = require('../lib/queries')(app);

  return (req, res, next) => {
    const getGroupsByTag = (tag) => {
      return models.Group.findAll({
        where: {
          isPublic: true,
          tags: { $contains: [tag] }
        },
        order: [['updatedAt', 'DESC']],
        limit: 6
      })
    };

    const getGroupsByTagForCollectiveCard = (tags) => {
      return new Promise((resolve, reject) => {
        getGroupsByTag(tags)
        .then(groups => {
          return Promise.all(groups.map(group => {
            return Promise.all([
              group.getYearlyIncome(),
              new Promise((resolve, reject) => {
                const appendTier = backers => {
                  backers = backers.map(backer => {
                    backer.tier = utils.getTier(backer, group.tiers);
                    return backer;
                  });
                  return backers;
                };
                queries.getUsersFromGroupWithTotalDonations(group.id)
                  .then(appendTier)
                  .then(resolve)
                  .catch(reject);
              })
            ])
            .then(values => {
              const groupInfo = group.info;
              groupInfo.yearlyIncome = values[0];
              const usersByRole = groupBy(values[1], 'role');
              groupInfo.backers = usersByRole[roles.BACKER] || [];
              return groupInfo;
            })
          }));
        })
        .then(resolve)
        .catch(reject);
      });
    };

    /**
     * get total number of active collectives
     * (a collective is considered as active if it has ever received any funding from its host or through a donation)
     */
    const getTotalCollectives = () => {
      return models.Transaction.aggregate('GroupId', 'count', {
        distinct: true,
        where: {
          amount: { $gt: 0 }
        }
      })
    };

    const getTotalDonors = () => {
      return models.Transaction.aggregate('UserId', 'count', {
        distinct: true,
        where: {
          amount: { $gt: 0 },
          PaymentMethodId: { $ne: null }
        }
      })
    };

    Promise.all([
      getTotalCollectives(),
      getTotalDonors(),
      queries.getTotalDonations(),
      getGroupsByTagForCollectiveCard('open source'),
      getGroupsByTagForCollectiveCard('meetup')
    ])
    .then(results => {
      const hp = {
        stats: {
          totalCollectives: results[0],
          totalDonors: results[1],
          totalDonations: results[2]
        },
        collectives: {
          opensource: results[3],
          meetup: results[4]
        }
      }
      res.send(hp);
    })
    .catch(next);
  }
};