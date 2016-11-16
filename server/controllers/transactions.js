/**
 * Get a transaction
 */
export const getOne = (req, res, next) => {
  return res.send(req.transaction);
};
