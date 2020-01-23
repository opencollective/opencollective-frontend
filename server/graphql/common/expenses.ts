import { ExpenseAttachment } from '../../models/ExpenseAttachment';

/**
 * Returns true if user is allowed to see the private infos for an expense.
 * Based on loaders, so it's safe to use this function in lists.
 */
export const canViewExpensePrivateInfo = async (expense, req): Promise<boolean> => {
  if (!req.remoteUser) {
    return false;
  } else if (req.remoteUser.isAdmin(expense.CollectiveId) || req.remoteUser.id === expense.UserId) {
    return true;
  } else {
    const collective = await req.loaders.Collective.byId.load(expense.CollectiveId);
    return req.remoteUser.isAdmin(collective.HostCollectiveId) || req.remoteUser.isAdmin(collective.ParentCollectiveId);
  }
};

/**
 * Returns the list of attachments for this expense.
 */
export const getExpenseAttachments = async (expenseId, req): Promise<ExpenseAttachment[]> => {
  return req.loaders.ExpenseAttachment.byExpenseId.load(expenseId);
};
