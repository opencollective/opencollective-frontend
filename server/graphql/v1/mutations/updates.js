import models from '../../../models';
import * as errors from '../../errors';
import { mustHaveRole } from '../../../lib/auth';
import { get } from 'lodash';
import { strip_tags } from '../../../lib/utils';

function require(args, path) {
  if (!get(args, path)) throw new errors.ValidationFailed({ message: `${path} required` });
}

export async function createUpdate(_, args, req) {
  const CollectiveId = get(args, 'update.collective.id');
  mustHaveRole(req.remoteUser, 'ADMIN', CollectiveId, 'create an update');
  require(args, 'update.title');

  const markdown = args.update.markdown ? strip_tags(args.update.markdown) : '';

  const update = await models.Update.create({
    title: args.update.title,
    markdown,
    html: strip_tags(args.update.html),
    CollectiveId,
    TierId: get(args, 'update.tier.id'),
    CreatedByUserId: req.remoteUser.id,
    FromCollectiveId: req.remoteUser.CollectiveId,
  });

  return update;
}

async function fetchUpdate(id) {
  const update = await models.Update.findById(id);
  if (!update) throw new errors.NotFound({ message: `Update with id ${id} not found` });
  return update;
}

export async function editUpdate(_, args, req) {
  require(args, 'update.id');
  const update = await fetchUpdate(args.update.id);
  return await update.edit(req.remoteUser, args.update);
}

export async function publishUpdate(_, args, req) {
  const update = await fetchUpdate(args.id);
  return await update.publish(req.remoteUser);
}

export async function unpublishUpdate(_, args, req) {
  const update = await fetchUpdate(args.id);
  return await update.unpublish(req.remoteUser);
}

export async function deleteUpdate(_, args, req) {
  const update = await fetchUpdate(args.id);
  return await update.delete(req.remoteUser);
}
