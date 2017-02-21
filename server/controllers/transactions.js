/**
 * Get a transaction
 */
export const getOne = (req, res) => {
  Promise.all([req.transaction.getHost(), req.transaction.getGroup(), req.transaction.getUser()])
    .then(results => {
      const host = results[0].public;
      const group = results[1].info;
      const user = results[2].public;
      host.billingAddress = results[0].billingAddress;
      user.billingAddress = results[2].billingAddress;
      return Object.assign({}, req.transaction.info, { host, group, user });
    })
    .then(transaction => res.send(transaction))
};
