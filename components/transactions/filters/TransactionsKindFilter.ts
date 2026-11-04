import { TransactionKind } from '../../../lib/constants/transactions';

export const getDefaultKinds = ({ isHost = false } = {}) => {
  const kinds = [
    TransactionKind.ADDED_FUNDS,
    TransactionKind.BALANCE_TRANSFER,
    TransactionKind.CONTRIBUTION,
    TransactionKind.EXPENSE,
  ];

  // On a Fiscal Host profile, PLATFORM_TIP transactions are the tips collected on the internal
  // "Platform Tips" child account (money owed to the platform, not host activity). For other
  // accounts they are tips the account gave, which are part of its own financial activity.
  if (!isHost) {
    kinds.push(TransactionKind.PLATFORM_TIP);
  }

  return kinds;
};
