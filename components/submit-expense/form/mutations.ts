import { gql } from '../../../lib/graphql/helpers';

export const updateAccountLegalNameMutation = gql`
  mutation UpdateAccountLegalName($account: AccountUpdateInput!) {
    editAccount(account: $account) {
      id
      legalName
    }
  }
`;

export const createVendorFromExpenseFlowMutation = gql`
  mutation CreateVendorFromExpenseFlow($host: AccountReferenceInput!, $vendor: VendorCreateInput!) {
    createVendor(host: $host, vendor: $vendor) {
      id
      slug
      name
      legalName
      type
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
