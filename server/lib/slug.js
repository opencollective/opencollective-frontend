import Promise from 'bluebird';
import roles from '../constants/roles';
import models from '../models';
import errors from '../lib/errors';

export function getUserOrGroupFromSlug(slug, userId) {
  return models.Group
    .findOne({where: {slug}})
    .then(group => {
      if (group) {
        return Promise.promisify(group.hasUserWithRole)(userId, roles.HOST)
          .then(isHost => {
            if (!isHost) {
              return Promise.reject(new errors.Forbidden(`You do not have access to this resource`));
            }
            return group;
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
              return Promise.reject(new errors.NotFound(`User or group ${slug} not found or is not a host of this group`));
            }
          });
      }
  });
}
