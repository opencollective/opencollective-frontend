import models from '../../../models';
import errors from '../../../lib/errors';
import { invalidateContributorsCache } from '../../../lib/contributors';

/** A mutation to edit the public message of all matching members. */
export async function editPublicMessage(_, { FromCollectiveId, CollectiveId, message }, req) {
  if (!req.remoteUser || !req.remoteUser.isAdmin(FromCollectiveId)) {
    throw new errors.Unauthorized("You don't have the permission to edit member public message");
  }
  const [quantityUpdated, updatedMembers] = await models.Member.update(
    {
      publicMessage: message,
    },
    {
      returning: true,
      where: {
        MemberCollectiveId: FromCollectiveId,
        CollectiveId: CollectiveId,
      },
    },
  );
  if (quantityUpdated === 0) {
    throw new errors.NotFound('No member found');
  }

  /**
   * After updating the public message it is necessary to update the cache
   * used in the collective page.
   */
  invalidateContributorsCache(CollectiveId);
  return updatedMembers;
}
