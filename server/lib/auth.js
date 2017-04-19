import models from '../models';

export function hasRole(userId, groupId, possibleRoles) {
  if (typeof possibleRoles === 'string') {
    possibleRoles = [possibleRoles];
  }

  const query = {
    where: {
      UserId: userId,
      GroupId: groupId,
      role: { $in: possibleRoles }
    }
  };
  return models.UserGroup.findOne(query)
  .then(ug => Boolean(ug))
}