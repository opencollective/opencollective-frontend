import { ExpenseAttachment } from '../../models/ExpenseAttachment';

const isOwner = async (req, expense): Promise<boolean> => {
  return req.remoteUser.isAdmin(expense.FromCollectiveId) || req.remoteUser.id === expense.UserId;
};

const isCollectiveAdmin = async (req, expense): Promise<boolean> => {
  if (req.remoteUser.isAdmin(expense.CollectiveId)) {
    return true;
  }

  const collective = await req.loaders.Collective.byId.load(expense.CollectiveId);
  return req.remoteUser.isAdmin(collective.ParentCollectiveId);
};

const isHostAdmin = async (req, expense): Promise<boolean> => {
  const collective = await req.loaders.Collective.byId.load(expense.CollectiveId);
  return req.remoteUser.isAdmin(collective.HostCollectiveId);
};

/**
 * Returns true if the expense meets at least one condition.
 * Always returns false for unkauthenticated requests.
 */
const checkExpensePermissions = async (req, expense, conditions): Promise<boolean> => {
  if (!req.remoteUser) {
    return false;
  }

  for (const condition of conditions) {
    if (await condition(req, expense)) {
      return true;
    }
  }

  return false;
};

/** Checks if the user can see expense's attachments */
export const canSeeExpenseAttachments = async (req, expense): Promise<boolean> => {
  return checkExpensePermissions(req, expense, [isOwner, isCollectiveAdmin, isHostAdmin]);
};

/** Checks if the user can see expense's payout method */
export const canSeeExpensePayoutMethod = async (req, expense): Promise<boolean> => {
  return checkExpensePermissions(req, expense, [isOwner, isHostAdmin]);
};

/** Checks if the user can see expense's payout method */
export const canSeeExpenseInvoiceInfo = async (req, expense): Promise<boolean> => {
  return checkExpensePermissions(req, expense, [isOwner, isHostAdmin]);
};

/** Checks if the user can see expense's payout method */
export const canSeeExpensePayeeLocation = async (req, expense): Promise<boolean> => {
  return checkExpensePermissions(req, expense, [isOwner, isHostAdmin]);
};

/**
 * Returns the list of attachments for this expense.
 */
export const getExpenseAttachments = async (expenseId, req): Promise<ExpenseAttachment[]> => {
  return req.loaders.ExpenseAttachment.byExpenseId.load(expenseId);
};
