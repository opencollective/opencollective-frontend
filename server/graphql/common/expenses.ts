import { ExpenseAttachment } from '../../models/ExpenseAttachment';

type ViewExpenseDataPermission = {
  attachments: boolean;
  payoutMethod: boolean;
  userLocation: boolean;
};

/**
 * Returns true if user is allowed to see the private infos for an expense.
 * Based on loaders, so it's safe to use this function in lists.
 */
export const canViewExpensePrivateInfo = async (expense, req): Promise<ViewExpenseDataPermission> => {
  if (!req.remoteUser) {
    return { attachments: false, payoutMethod: false, userLocation: false };
  } else if (req.remoteUser.isAdmin(expense.FromCollectiveId) || req.remoteUser.id === expense.UserId) {
    // Users can see the all the private info for the collective they're admin of and the expenses they submit
    return { attachments: true, payoutMethod: true, userLocation: true };
  } else if (req.remoteUser.isAdmin(expense.CollectiveId)) {
    // Collective admins can see the attachments, but not the payout method
    return { attachments: true, payoutMethod: false, userLocation: false };
  } else {
    // Users can see the private info for the expenses submitted to collectives they're hosting
    const collective = await req.loaders.Collective.byId.load(expense.CollectiveId);
    const isHostAdmin = req.remoteUser.isAdmin(collective.HostCollectiveId);
    const isParentCollectiveAdmin = req.remoteUser.isAdmin(collective.ParentCollectiveId);
    return {
      payoutMethod: isHostAdmin,
      attachments: isHostAdmin || isParentCollectiveAdmin,
      userLocation: isHostAdmin,
    };
  }
};

/**
 * Returns the list of attachments for this expense.
 */
export const getExpenseAttachments = async (expenseId, req): Promise<ExpenseAttachment[]> => {
  return req.loaders.ExpenseAttachment.byExpenseId.load(expenseId);
};
