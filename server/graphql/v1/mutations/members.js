import { pick } from 'lodash';

import models from '../../../models';
import errors from '../../../lib/errors';
import roles from '../../../constants/roles';

export async function createMember(_, args, req) {
  const checkPermission = collective => {
    if (!req.remoteUser) {
      throw new errors.Unauthorized('You need to be logged in to create a member');
    }
    if (!req.remoteUser.isAdmin(collective.id)) {
      throw new errors.Unauthorized(
        `You need to be logged in as a core contributor or as a host of the ${collective.slug} collective`,
      );
    }
  };

  const collective = await req.loaders.collective.findById.load(args.collective.id);

  if (!collective) {
    throw new Error(`Collective with id ${args.collective.id} not found`);
  }

  if (args.role !== roles.FOLLOWER) {
    checkPermission(collective);
  }

  let user;
  if (args.member.id) {
    user = await models.User.findOne({ where: { CollectiveId: args.member.id } });
  }
  if (!user) {
    user = await models.User.findOrCreateByEmail(args.member.email, args.member);
  }

  return models.Member.create({
    // NOTE: doesn't look like a good idea to set CreatedByUserId != req.remoteUser.id
    CreatedByUserId: user.id,
    MemberCollectiveId: user.CollectiveId,
    CollectiveId: collective.id,
    role: args.role.toUpperCase() || roles.FOLLOWER,
    since: args.since,
  });
}

export async function removeMember(_, args, req) {
  const checkPermission = member => {
    if (!req.remoteUser) {
      throw new errors.Unauthorized('You need to be logged in to remove a member');
    }
    if (req.remoteUser.isAdmin(member.MemberCollectiveId)) {
      return true;
    }
    if (req.remoteUser.isAdmin(member.CollectiveId)) {
      return true;
    }
    throw new errors.Unauthorized(
      `You need to be logged in as this user or as a core contributor or as a host of the collective id ${member.CollectiveId}`,
    );
  };

  const collective = args.collective;
  const memberCollective = args.member; // args.member is not a "member" but a "collective", we make it explicit

  const member = await models.Member.findOne({
    where: {
      MemberCollectiveId: memberCollective.id,
      CollectiveId: collective.id,
      role: args.role,
    },
  });

  if (!member) {
    throw new errors.NotFound('Member not found');
  }

  checkPermission(member);

  return member.destroy();
}

/**
 * A mutation to edit membership. Dedicated to the member user, not the collective admin.
 */
export async function editMembership(_, args, req) {
  const member = await models.Member.findByPk(args.id);

  // Only admin of member collective can edit the membership
  if (!member || !req.remoteUser || !req.remoteUser.isAdmin(member.MemberCollectiveId)) {
    throw new errors.Unauthorized("This member doesn't exist or you don't have the permission to edit it");
  }

  return member.update(pick(args, ['publicMessage']));
}
