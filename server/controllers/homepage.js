/**
 * Controller.
 */
module.exports = function(app) {

  const models = app.set('models');
  const queries = require('../lib/queries')(models.sequelize);

  return (req, res, next) => {
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
      models.Group.getGroupsSummaryByTag('open source', 3, [], 100, true),
      models.Group.getGroupsSummaryByTag('meetup', 3, [], 100, true),
      queries.getTopSponsors()
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
        },
        sponsors: results[5]
      }
      res.send(hp);
    })
    .catch(next);
  }
};