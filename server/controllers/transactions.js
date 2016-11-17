/**
 * Get a transaction
 */
export const getOne = (req, res) => {
  Promise.all([req.transaction.getHost(), req.transaction.getGroup()])
    .then(results => Object.assign({}, req.transaction.info, { host: results[0].info, group: results[1].info }))
    .then(transaction => res.send(transaction))
};
