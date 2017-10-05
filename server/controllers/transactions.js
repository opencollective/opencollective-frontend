import models from '../models';

/**
 * Get a transaction
 */
export const getOne = (req, res) => {
  Promise.all([
    models.User.findOne({
      where: { CollectiveId: req.transaction.HostCollectiveId },
      include: [ { model: models.Collective, as: 'collective' } ]
    }),
    req.transaction.getCollective(),
    req.transaction.getFromCollective(),
    req.transaction.getCreatedByUser()
  ])
    .then(results => {
      const host = results[0].collective.info;
      const collective = results[1].card;
      const fromCollective = results[2].card;
      const createdByUser = results[3].public;
      host.billingAddress = results[0].billingAddress;
      createdByUser.billingAddress = results[3].billingAddress;
      return Object.assign({}, req.transaction.info, { host, fromCollective, collective, createdByUser });
    })
    .then(transaction => res.send(transaction))
};
