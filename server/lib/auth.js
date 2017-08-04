import models from '../models';
import roles from '../constants/roles';
import { intersection } from 'lodash';

export function hasRole(MemberCollectiveId, CollectiveId, possibleRoles) {
  if (!MemberCollectiveId || !CollectiveId) return Promise.resolve(false);

  if (typeof possibleRoles === 'string') {
    possibleRoles = [ possibleRoles ];
  }

  const query = {
    attributes: ['id'],
    where: {
      MemberCollectiveId,
      CollectiveId,
      role: { $in: possibleRoles }
    }
  };
  return models.Member.findOne(query)
  .then(ug => Boolean(ug))
}

/**
 * The remote user can only access the personal details of a user if:
 *  - if it is the user
 *  - if it is the host or admin of a collective that the user is a member of (as a backer or member)
 * @param {*} RemoteUserCollective 
 * @param {*} UserCollective 
 */
export function canAccessUserDetails(RemoteUserCollectiveId, UserCollectiveId) {
  if (!RemoteUserCollectiveId) return Promise.resolve(false);
  if (RemoteUserCollectiveId === UserCollectiveId) return Promise.resolve(true);

  return Promise.props({
    canEditCollectives: models.Member.findAll({
                          attributes: [ 'CollectiveId' ],
                          where: { MemberCollectiveId: RemoteUserCollectiveId, role: { $in: [ roles.ADMIN, roles.HOST ] } }
                        }),
    memberOfCollectives: models.Member.findAll({
                           attributes: [ 'CollectiveId' ],
                           where: { MemberCollectiveId: UserCollectiveId, role: { $ne: roles.FOLLOWER } }
                         })
  })
  .then(props => {
    return (intersection(props.canEditCollectives, props.memberOfCollectives).length > 0);
  })
}