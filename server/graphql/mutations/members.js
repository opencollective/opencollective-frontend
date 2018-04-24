import models from '../../models';
import errors from '../../lib/errors';
import roles from '../../constants/roles';

export function createMember(_, args, req) {
  let collective;

  const checkPermission = () => {
    if (!req.remoteUser) throw new errors.Unauthorized("You need to be logged in to create a member");
    if (req.remoteUser.isAdmin(collective.id)) return true;
    throw new errors.Unauthorized(`You need to be logged in as a core contributor or as a host of the ${collective.slug} collective`);
  }

  return req.loaders.collective.findById.load(args.collective.id)
  .then(c => {
    if (!c) throw new Error(`Collective with id ${args.collective.id} not found`);
    collective = c;
  })
  .then(() => {
    if (args.role !== roles.FOLLOWER) {
      return checkPermission();
    } else {
      return null;
    }
  })
  // find or create user
  .then(() => {
    if (args.member.id) {
      return req.loaders.collective.findById.load(args.member.id).then(memberCollective => {
        return {
          id: memberCollective.CreatedByUserId,
          CollectiveId: memberCollective.id
        }
      });
    }
  })
  .then(u => u || models.User.findOrCreateByEmail(args.member.email, args.member))
  // add user as member of the collective
  .then((user) => models.Member.create({
    CreatedByUserId: user.id,
    MemberCollectiveId: user.CollectiveId,
    CollectiveId: collective.id,
    role: args.role.toUpperCase() || roles.FOLLOWER
  }));
}

export function removeMember(_, args, req) {
  let membership;

  const checkPermission = () => {
    if (!req.remoteUser) throw new errors.Unauthorized("You need to be logged in to remove a member");
    if (req.remoteUser.id === membership.CreatedByUserId) return true;
    if (req.remoteUser.isAdmin(membership.CollectiveId)) return true;

    throw new errors.Unauthorized(`You need to be logged in as this user or as a core contributor or as a host of the collective id ${membership.CollectiveId}`);
  }

  return models.Member.findOne({
      where: {
        MemberCollectiveId: args.member.id,
        CollectiveId: args.collective.id,
        role: args.role
      }
    })
    .then(m => {
      if (!m) throw new errors.NotFound("Member not found");
      membership = m;
    })
    .then(checkPermission)
    .then(() => {
      return membership.destroy();
    })
}
