import models from '../models';

export function hasRole(userId, collectiveId, possibleRoles) {
  if (typeof possibleRoles === 'string') {
    possibleRoles = [possibleRoles];
  }

  const query = {
    where: {
      UserId: userId,
      CollectiveId: collectiveId,
      role: { $in: possibleRoles }
    }
  };
  return models.UserCollective.findOne(query)
  .then(ug => Boolean(ug))
}