import type {
  TransactionDetailsQuery,
  TransactionsTableQueryCollectionFragment,
} from '../../../../lib/graphql/types/v2/graphql';

export type TransactionsTableQueryNode = TransactionsTableQueryCollectionFragment['nodes'][number];
export type TransactionDetailsQueryNode = TransactionDetailsQuery['transaction'];
