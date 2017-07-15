import Promise from 'bluebird';
import roles from '../constants/roles';
import models from '../models';
import errors from '../lib/errors';

export function getUserOrCollectiveFromSlug(slug, userId) {
  return models.Collective
    .findOne({where: {slug}})
    .then(collective => {
      if (collective) {
        return Promise.promisify(collective.hasUserWithRole)(userId, roles.HOST)
          .then(isHost => {
            if (!isHost) {
              return Promise.reject(new errors.Forbidden(`You do not have access to this resource`));
            }
            return collective;
          });
      } else {
        return models.User.findOne({
          where: {
            username: slug,
            id: userId
          }
        })
          .then(user => {
            if (user) {
              return user;
            } else {
              return Promise.reject(new errors.NotFound(`User or collective ${slug} not found or is not a host of this collective`));
            }
          });
      }
  });
}
