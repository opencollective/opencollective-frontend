import { TransactionKind, TransactionType } from '../../lib/graphql/types/v2/graphql';

type ContributionTransaction = {
  kind?: TransactionKind | null;
  type?: TransactionType | null;
  createdAt?: string | Date | null;
};

const PRIMARY_TRANSACTION_KIND_PRIORITY = [
  TransactionKind.CONTRIBUTION,
  TransactionKind.ADDED_FUNDS,
  TransactionKind.BALANCE_TRANSFER,
];

const getTimestamp = (value: string | Date | null | undefined) => (value ? new Date(value).getTime() : 0);

const hasKindPriority = (kind: ContributionTransaction['kind']) =>
  kind && PRIMARY_TRANSACTION_KIND_PRIORITY.includes(kind);

function sortByPrimaryPriority<T extends ContributionTransaction>(transactions: T[]): T[] {
  return [...transactions].sort((a, b) => {
    if (hasKindPriority(a.kind) && !hasKindPriority(b.kind)) {
      return -1;
    } else if (!hasKindPriority(a.kind) && hasKindPriority(b.kind)) {
      return 1;
    } else if (a.type === TransactionType.CREDIT && b.type !== TransactionType.CREDIT) {
      return -1;
    } else if (a.type !== TransactionType.CREDIT && b.type === TransactionType.CREDIT) {
      return 1;
    }
    return getTimestamp(a.createdAt) - getTimestamp(b.createdAt);
  });
}

export function getPrimaryContributionTransaction<T extends ContributionTransaction>(transactions: T[]): T {
  return sortByPrimaryPriority(transactions)[0];
}
