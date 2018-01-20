import models from '../models';
import Promise from 'bluebird';
import * as errors from '../graphql/errors';

/**
 * Returns the subset of UserCollectiveIds that the remoteUser has access to
 */
export function getListOfAccessibleUsers(remoteUser, UserCollectiveIds) {
  if (!remoteUser) return Promise.resolve([]);
  if (!remoteUser.rolesByCollectiveId) return Promise.resolve([]);
  // all the CollectiveIds that the remoteUser is admin of.
  const adminOfCollectives = Object.keys(remoteUser.rolesByCollectiveId).filter(CollectiveId => remoteUser.isAdmin(CollectiveId));
  return models.Member.findAll({
    attributes: ['MemberCollectiveId'],
    where: {
      MemberCollectiveId: { $in: UserCollectiveIds },
      CollectiveId: { $in: adminOfCollectives }
    },
    group: ['MemberCollectiveId']
  })
  .then(results => results.map(r => r.MemberCollectiveId))
}


export function mustBeLoggedInTo(remoteUser, action = "do this") {
  if (!remoteUser) {
    throw new errors.Unauthorized({ message: `You must be logged in to ${action}` });
  }
}

export function mustHaveRole(remoteUser, roles, CollectiveId, action = "perform this action") {
  mustBeLoggedInTo(remoteUser, action);
  if (!CollectiveId || !remoteUser.hasRole(roles, CollectiveId)) {
    throw new errors.Unauthorized({ message: `You don't have sufficient permissions to ${action}` });
  }
}