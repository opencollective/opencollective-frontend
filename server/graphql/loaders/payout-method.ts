import DataLoader from 'dataloader';
import models, { Op } from '../../models';
import { ExpenseAttachment } from '../../models/ExpenseAttachment';
import { sortResultsArray } from './helpers';

/**
 * Loader for collective's paypal payout methods
 */
export const generateCollectivePaypalPayoutMethodsLoader = (): DataLoader<number, ExpenseAttachment[]> => {
  return new DataLoader(async (collectiveIds: number[]) => {
    const payoutMethods = await models.PayoutMethod.scope('paypal').findAll({
      where: { CollectiveId: { [Op.in]: collectiveIds } },
    });

    return sortResultsArray(collectiveIds, payoutMethods, pm => pm.CollectiveId);
  });
};

/**
 * Loader for all collective's payout methods
 */
export const generateCollectivePayoutMethodsLoader = (): DataLoader<number, ExpenseAttachment[]> => {
  return new DataLoader(async (collectiveIds: number[]) => {
    const payoutMethods = await models.PayoutMethod.findAll({
      where: { CollectiveId: { [Op.in]: collectiveIds } },
    });

    return sortResultsArray(collectiveIds, payoutMethods, pm => pm.CollectiveId);
  });
};
