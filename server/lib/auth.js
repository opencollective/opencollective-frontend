import models from '../models';
import roles from '../constants/roles';
import { intersection } from 'lodash';
import Promise from 'bluebird';
import LRU from 'lru-cache';

const cache = LRU({
  max: 1000,
  maxAge: 1000 * 60 * 60 // we keep it max 1h
});

const canEditCollectives = (RemoteUserCollectiveId) => {
  const cachedVersion = cache.get(`RemoteUserCollectiveId:${RemoteUserCollectiveId}`);
  if (cachedVersion) {
    return Promise.resolve(cachedVersion)
  }

  return models.Member.findAll({
    attributes: [ 'CollectiveId' ],
    where: { MemberCollectiveId: RemoteUserCollectiveId, role: { $in: [ roles.ADMIN, roles.HOST ] } }
  })
  .then(rows => rows.map(r => r.CollectiveId))
  .then(results => {
    cache.set(`RemoteUserCollectiveId:${RemoteUserCollectiveId}`, results);
    return results;
  })
};

const memberOfCollectives = (UserCollectiveId) => {
  const cachedVersion = cache.get(`UserCollectiveId:${UserCollectiveId}`);
  if (cachedVersion) {
    return Promise.resolve(cachedVersion)
  }

  return models.Member.findAll({
    attributes: [ 'CollectiveId' ],
    where: { MemberCollectiveId: UserCollectiveId, role: { $ne: roles.FOLLOWER } }
  })
  .then(rows => rows.map(r => r.CollectiveId))
  .then(results => {
    cache.set(`UserCollectiveId:${UserCollectiveId}`, results);
    return results;
  })
};

/**
 * The remote user can only access the personal details of a user if:
 *  - if it is the user
 *  - if it is the host or admin of a collective that the user is a member of (as a backer or admin)
 * @param {*} RemoteUserCollective 
 * @param {*} UserCollective 
 */
export function canAccessUserDetails(remoteUser, UserCollectiveId) {
  if (!remoteUser) return Promise.resolve(false);
  if (remoteUser.CollectiveId === UserCollectiveId) return Promise.resolve(true);
  if (!remoteUser.memberships) return Promise.resolve(false);
  const adminOfCollectives = Object.keys(remoteUser.rolesByCollectiveId).filter(CollectiveId => remoteUser.isAdmin(CollectiveId));
  return memberOfCollectives(UserCollectiveId)
  .then(collectives => {
    return (intersection(adminOfCollectives, collectives).length > 0);
  })
}