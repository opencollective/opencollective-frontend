import * as collectives from './collectives';
import * as users from './users';
import models from '../models';
import errors from '../lib/errors';

export default (req, res, next) => {
  const slug = req.params.slug.toLowerCase();

  // TODO use slugLib.js to get user or collective
  models.Collective
    .findOne({where: { slug }})
    .then((collective) => {
      if (collective) {
        req.collective = collective;
        return collectives.getOne(req, res, next);
      } else {
        models.User.findOne({where: {username: slug}})
        .then((user) => {
          if (user) {
            req.user = user;
            req.query.profile = true;
            return users.show(req, res, next);
          } else {
            return next(new errors.NotFound(`There is no collective or user at this url /${slug}`));
          }
        })
      }
    });
};
