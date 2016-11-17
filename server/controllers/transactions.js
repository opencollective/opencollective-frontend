/**
 * Get a transaction
 */
export const getOne = (req, res) => {
  Promise.all([req.transaction.getHost(), req.transaction.getGroup()])
    .then(results => {
      const host = results[0].info;
      const group = results[1].info;
      host.billingAddress = results[0].billingAddress;
      return Object.assign({}, req.transaction.info, { host, group });
    })
    .then(transaction => res.send(transaction))
};
