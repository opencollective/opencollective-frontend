import models from '../models';

export function hasRole(userId, collectiveId, possibleMembers) {
  if (typeof possibleMembers === 'string') {
    possibleMembers = [possibleMembers];
  }

  const query = {
    where: {
      UserId: userId,
      CollectiveId: collectiveId,
      role: { $in: possibleMembers }
    }
  };
  return models.Member.findOne(query)
  .then(ug => Boolean(ug))
}