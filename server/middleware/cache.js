export default (maxAge) => {
  maxAge = maxAge || 5;
  return (req, res, next) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    next();
  }
};
