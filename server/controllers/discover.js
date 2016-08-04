/**
 * Controller.
 */
module.exports = function(app) {

  const models = app.set('models');

  return (req, res, next) => {
    const show = req.query.show;
    const sort = req.query.sort;
    models.Group.getGroupsSummaryByTag(!show || show === 'all' ? '' : show, 10, [], 0, false)
    .then(results => {
      const di = {
        show: show,
        sort: sort,
        collectives: results
      };
      res.send(di);
    })
    .catch(next);
  }
};