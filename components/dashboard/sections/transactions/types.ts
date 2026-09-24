import type {
  TransactionDetailsQuery,
  TransactionsTableQueryCollectionFragmentFragment,
} from '../../../../lib/graphql/types/v2/graphql';

export type TransactionsTableQueryNode = TransactionsTableQueryCollectionFragmentFragment['nodes'][number];
export type TransactionDetailsQueryNode = TransactionDetailsQuery['transaction'];
