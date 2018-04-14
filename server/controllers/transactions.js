import models, { sequelize } from '../models';
import { getFxRate } from '../lib/currency';

export const getFxRateController = (req, res, next) => {
  const {
    fromCurrency,
    toCurrency,
    date
  } = req.params;

  return getFxRate(fromCurrency, toCurrency, date).then(fxrate => {
    return res.send({fxrate});
  }).catch(next);
}

/**
 * Get a transaction
 */
export const getOne = (req, res, next) => {
  Promise.all([
    models.Collective.findOne({
      where: { id: req.transaction.HostCollectiveId },
    }),
    req.transaction.getCollective(),
    req.transaction.getFromCollective(),
    req.transaction.getCreatedByUser(),

    // TODO: we shouldn't need two paths to fetch a host
    // User->Collective relationship needs to be stored in the Members table

    // case 1: in case Host is a USER, fetch that user (needed for billing address)
    models.User.findOne({
      where: { CollectiveId: req.transaction.HostCollectiveId }
    }),

    // case 2: in case Host is an ORG, look up an admin with a billing address
    // in the Members table
    sequelize.query(`
    WITH admins AS 
      (SELECT "MemberCollectiveId" FROM "Members" 
        WHERE "CollectiveId" = :HostCollectiveId 
        AND (role = 'ADMIN' OR role = 'HOST'))
    
    SELECT * FROM "Users" 
    WHERE "billingAddress" IS NOT NULL 
      AND "CollectiveId" IN (SELECT * FROM admins);

      `, {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          HostCollectiveId: req.transaction.HostCollectiveId
        }}) // fetch all admins of the host and see if any of them have a billingAddress.
  ])
    .then(results => {
      const host = results[0].info;
      const collective = results[1].card;
      const fromCollective = results[2].card;
      const createdByUser = results[3].public;
      const userAdmin = results[4];
      const hostAdmins = results[5];
      createdByUser.billingAddress = results[3].billingAddress;

      if (userAdmin) {
        host.billingAddress = userAdmin.billingAddress;
      } else if (hostAdmins.length > 0) {
        host.billingAddress = hostAdmins[0].billingAddress;
      }
      return Object.assign({}, req.transaction.info, { host, fromCollective, collective, createdByUser });
    })
    .then(transaction => res.send(transaction))
    .catch(next)
};
