/**
 * Controller.
 */
module.exports = function(app) {

  const models = app.set('models');

  return (req, res, next) => {
    const show = req.query.show;
    const sort = req.query.sort;
    const offset = req.query.offset;
    models.Group.getGroupsSummaryByTag(
      !show || show === 'all' ? '' : show, 
      12,
      [], 
      100, 
      false,
      'g."createdAt"',
      sort === 'newest' ? 'desc' : 'asc',
      offset
    )
    .then(results => {
      const di = {
        show: show,
        sort: sort,
        offset: offset,
        collectives: results
      };
      res.send(di);
    })
    .catch(next);
  }
};