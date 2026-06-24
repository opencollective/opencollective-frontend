import { TransactionKind } from '../../../lib/constants/transactions';

// (!) Remember that any changes made here should be applied to the cache in API > `getCacheKeyForBudgetOrTransactionsSections`
export const getDefaultKinds = () => {
  return [
    TransactionKind.ADDED_FUNDS,
    TransactionKind.BALANCE_TRANSFER,
    TransactionKind.CONTRIBUTION,
    TransactionKind.EXPENSE,
    TransactionKind.PLATFORM_TIP,
    TransactionKind.HOST_FEE,
  ];
};
