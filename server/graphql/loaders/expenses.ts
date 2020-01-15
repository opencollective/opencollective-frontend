import DataLoader from 'dataloader';
import models, { Op } from '../../models';
import { ExpenseAttachment } from '../../models/ExpenseAttachment';
import { sortResultsArray } from './helpers';

/**
 * Loader for expense's attachments.
 */
export const generateExpenseAttachmentsLoader = (): DataLoader<number, ExpenseAttachment[]> => {
  return new DataLoader(async (expenseIds: number[]) => {
    const attachments = await models.ExpenseAttachment.findAll({
      where: { ExpenseId: { [Op.in]: expenseIds } },
    });

    return sortResultsArray(expenseIds, attachments, attachment => attachment.ExpenseId);
  });
};
