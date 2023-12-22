import { gql } from './helpers';

export const refundTransactionMutation = gql`
  mutation RefundTransaction($transaction: TransactionReferenceInput!) {
    refundTransaction(transaction: $transaction) {
      id
    }
  }
`;

export const rejectTransactionMutation = gql`
  mutation RejectTransaction($transaction: TransactionReferenceInput!, $message: String) {
    rejectTransaction(transaction: $transaction, message: $message) {
      id
    }
  }
`;
