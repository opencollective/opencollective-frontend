import models from '../models';

export default (req, res, next) => {
  const show = req.query.show || 'all';
  const sort = (req.query.sort === 'newest') ? 'newest' : 'most popular';
  const { offset } = req.query;

  let orderBy;
  switch (sort) {
    case 'newest':
      orderBy = 'g."createdAt"';
      break;
    case 'most popular':
    default:
      orderBy = 't."totalDonations"';
      break;
  }

  models.Group.getGroupsSummaryByTag(
    !show || show === 'all' ? '' : show,
    12,
    [],
    1000,
    false,
    orderBy,
    'desc',
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
