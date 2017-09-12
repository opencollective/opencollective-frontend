import queries from '../lib/queries';
import models from '../models';

export default (req, res, next) => {
  /**
   * get total number of active collectives
   * (a collective is considered as active if it has ever received any funding from its host or through a order)
   */
  const getTotalCollectives = () => {
    return models.Transaction.aggregate('CollectiveId', 'count', {
      distinct: true,
      where: {
        amount: { $gt: 0 }
      }
    })
  };

  const getTotalDonors = () => {
    return models.Transaction.aggregate('FromCollectiveId', 'count', {
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
    queries.getTotalAnnualBudget(),
    models.Collective.getCollectivesSummaryByTag('open source', 3, [], 100000, true),
    models.Collective.getCollectivesSummaryByTag('meetup', 3, [], 100000, true),
    queries.getTopSponsors()
  ])
  .then(results => {
    const hp = {
      stats: {
        totalCollectives: results[0],
        totalDonors: results[1],
        totalAnnualBudget: results[2]
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
};
