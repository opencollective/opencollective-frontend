import models, { sequelize } from '../models';
import { getFxRate } from '../lib/currency';
import Promise from 'bluebird';

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
export const getOne = (req, res) => {
  const { transaction } = req;

  return Promise.props({
    collective: transaction.getCollective(),
    fromCollective: transaction.getFromCollective(),
    createdByUser: transaction.getCreatedByUser(),
  })
  .then(async (results) => {
    const { collective, fromCollective, createdByUser } = results;
    let host;
    if (transaction.HostCollectiveId) {
      host = await collective.getHostCollective();
    } else {
      // If there is no HostCollectiveId, then the transaction is related to a user or organization
      // - could be a DEBIT (donation made by a user to `fromCollective`); or
      // - could be a CREDIT (received money from `fromCollective` to reimburse an ExpenseId)
      // in both cases, the host of the transaction is the host of the `fromCollective`
      host = await fromCollective.getHostCollective();
    }
    return {
      ...transaction.info,
      host: host.invoice,
      fromCollective: fromCollective.invoice,
      collective: collective.invoice,
      createdByUser: createdByUser && createdByUser.public
    };
  })
  .then(transaction => res.send(transaction))
};
