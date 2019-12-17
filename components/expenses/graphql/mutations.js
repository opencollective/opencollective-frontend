import gql from 'graphql-tag';

export const payExpenseMutation = gql`
  mutation payExpense(
    $id: Int!
    $paymentProcessorFeeInCollectiveCurrency: Int
    $hostFeeInCollectiveCurrency: Int
    $platformFeeInCollectiveCurrency: Int
    $forceManual: Boolean
  ) {
    payExpense(
      id: $id
      paymentProcessorFeeInCollectiveCurrency: $paymentProcessorFeeInCollectiveCurrency
      hostFeeInCollectiveCurrency: $hostFeeInCollectiveCurrency
      platformFeeInCollectiveCurrency: $platformFeeInCollectiveCurrency
      forceManual: $forceManual
    ) {
      id
      status
      collective {
        id
        stats {
          id
          balance
        }
        host {
          id
          paymentMethods {
            id
            balance
          }
        }
      }
    }
  }
`;
