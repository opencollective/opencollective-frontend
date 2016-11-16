/**
 * Get a transaction
 */
export const getOne = (req, res) => {
  return res.send(req.transaction);
};
