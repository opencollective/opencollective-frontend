import models from '../models';

export default (req, res, next) => {
  const show = req.query.show || 'all';
  const sort = req.query.sort === 'newest' ? 'newest' : 'most popular';
  const { offset } = req.query;

  let orderBy;
  switch (sort) {
    case 'newest':
      orderBy = 'c."createdAt"';
      break;
    case 'most popular':
    default:
      orderBy = '"totalDonations"';
      break;
  }

  models.Collective.getCollectivesSummaryByTag(
    !show || show === 'all' ? '' : show,
    12,
    [],
    500,
    false,
    orderBy,
    'desc',
    offset,
  )
    .then(({ collectives, total }) => {
      const di = {
        show,
        sort,
        offset,
        collectives,
        total,
      };
      res.send(di);
    })
    .catch(next);
};
