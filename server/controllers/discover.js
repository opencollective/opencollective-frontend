import models from '../models';

export default (req, res, next) => {
  const show = req.query.show || 'all';
  const sort = req.query.sort === 'oldest' ? 'oldest' : 'newest';
  const { offset } = req.query;
  models.Group.getGroupsSummaryByTag(
    !show || show === 'all' ? '' : show,
    12,
    [],
    10000,
    false,
    'g."createdAt"',
    sort === 'newest' ? 'desc' : 'asc',
    offset
  )
  .then(collectives => {
    const di = {
      show,
      sort,
      offset,
      collectives
    };
    res.send(di);
  })
  .catch(next);
};
