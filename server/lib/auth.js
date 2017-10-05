import models from '../models';
import Promise from 'bluebird';

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