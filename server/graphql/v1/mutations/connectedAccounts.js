import errors from '../../../lib/errors';
import models from '../../../models';
import { pick } from 'lodash';

const ediableAttributes = ['settings'];

/** connectedAccount
 * Only the author or an admin of the collective can edit a connectedAccount
 */
function canEditConnectedAccount(remoteUser, connectedAccount) {
  if (remoteUser.isAdmin(connectedAccount.CollectiveId)) {
    return true;
  }
  return false;
}

export async function editConnectedAccount(remoteUser, connectedAccountData) {
  if (!remoteUser) {
    throw new errors.Unauthorized('You need to be logged in to edit a connected account');
  }

  const connectedAccount = await models.ConnectedAccount.findByPk(connectedAccountData.id);

  if (!connectedAccount) {
    throw new errors.Unauthorized('Connected account not found');
  }

  if (!canEditConnectedAccount(remoteUser, connectedAccount)) {
    throw new errors.Unauthorized("You don't have permission to edit this connected account");
  }

  await connectedAccount.update(pick(connectedAccountData, ediableAttributes));
  return connectedAccount;
}

export async function deleteConnectedAccount(remoteUser, connectedAccountId) {
  if (!remoteUser) {
    throw new errors.Unauthorized('You need to be logged in to delete a connected account');
  }

  const connectedAccount = await models.ConnectedAccount.findByPk(connectedAccountId);

  if (!connectedAccount) {
    throw new errors.Unauthorized('Connected account not found');
  }

  if (!canEditConnectedAccount(remoteUser, connectedAccount)) {
    throw new errors.Unauthorized("You don't have permission to delete this connected account");
  }

  const res = await connectedAccount.destroy();
  return res;
}
