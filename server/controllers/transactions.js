/**
 * Get a transaction
 */
export const getOne = (req, res) => {
  req.transaction.getHost()
    .then(host => Object.assign({}, req.transaction.info, { host: host.info }))
    .then(transaction => res.send(transaction))
};
