import { gql } from '../../../lib/graphql/helpers';

export const updateAccountLegalNameMutation = gql`
  mutation UpdateAccountLegalName($account: AccountUpdateInput!) {
    editAccount(account: $account) {
      id
      legalName
    }
  }
`;
