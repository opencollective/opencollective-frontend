import errors from '../../../lib/errors';

export function editTiers(_, args, req) {
  let collective;
  if (!req.remoteUser) {
    throw new errors.Unauthorized('You need to be logged in to edit tiers');
  }

  return req.loaders.Collective.byId
    .load(args.id)
    .then(c => {
      if (!c) {
        throw new Error(`Collective with id ${args.id} not found`);
      }
      collective = c;
      return req.remoteUser.isAdmin(collective.id);
    })
    .then(canEdit => {
      if (!canEdit) {
        throw new errors.Unauthorized(
          `You need to be logged in as a core contributor or as a host of the ${collective.name} collective`,
        );
      }
    })
    .then(() => collective.editTiers(args.tiers));
}

/**
 * Edit a single tier
 */
export async function editTier(_, args, req) {
  if (!req.remoteUser) {
    throw new errors.Unauthorized();
  }

  const tier = await req.loaders.Tier.byId.load(args.tier.id);
  if (!req.remoteUser.isAdmin(tier.CollectiveId)) {
    throw new errors.Unauthorized();
  }

  return tier.update(args.tier);
}
