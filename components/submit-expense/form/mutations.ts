import { gql } from '../../../lib/graphql/helpers';

export const updateAccountLegalNameMutation = gql`
  mutation UpdateAccountLegalName($account: AccountUpdateInput!) {
    editAccount(account: $account) {
      id
      legalName
    }
  }
`;

export const updateAccountUSEntityMutation = gql`
  mutation UpdateAccountUSEntity($account: AccountUpdateInput!) {
    editAccount(account: $account) {
      id
      isUSEntity
    }
  }
`;

export const createOrganizationFromExpenseFlowMutation = gql`
  mutation CreateOrganizationFromExpenseFlow($organization: OrganizationCreateInput!) {
    createOrganization(organization: $organization) {
      id
      slug
      name
      legalName
      type
    }
  }
`;
