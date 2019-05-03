import { map } from 'lodash';
import errors from '../../../lib/errors';

export function editTiers(_, args, req) {
  let collective;
  if (!req.remoteUser) {
    throw new errors.Unauthorized('You need to be logged in to edit tiers');
  }

  const tiers = map(args.tiers, tier => {
    if (!tier.minimumAmount) {
      if (tier.presets && tier.presets.length > 0 && tier.amount) {
        tier.minimumAmount = Math.min(tier.amount, ...tier.presets);
      } else if (tier.presets && tier.presets.length > 0 && !tier.amount) {
        tier.minimumAmount = Math.min(...tier.presets);
      } else if (tier.amount) {
        tier.minimumAmount = tier.amount;
      }
    }
    return tier;
  });

  return req.loaders.collective.findById
    .load(args.id)
    .then(c => {
      if (!c) throw new Error(`Collective with id ${args.id} not found`);
      collective = c;
      return req.remoteUser.isAdmin(collective.id);
    })
    .then(canEdit => {
      if (!canEdit)
        throw new errors.Unauthorized(
          `You need to be logged in as a core contributor or as a host of the ${collective.name} collective`,
        );
    })
    .then(() => collective.editTiers(tiers));
}
