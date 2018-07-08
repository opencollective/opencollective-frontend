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
    const host = await transaction.getHostCollective();
    if (!host) throw new Error("No host attached to this transaction");

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
