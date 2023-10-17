import { gql } from '@apollo/client';

export const processApplicationAccountFields = gql`
  fragment ProcessHostApplicationFields on AccountWithHost {
    isActive
    approvedAt
    isApproved
    host {
      id
    }
  }
`;
export const hostApplicationsMetadataQuery = gql`
  query HostApplicationsMetadata($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      slug
      name
      type
      settings
      policies {
        id
        COLLECTIVE_MINIMUM_ADMINS {
          numberOfAdmins
        }
      }

      pending: hostApplications(limit: 0, offset: 0, status: PENDING) {
        totalCount
      }
      approved: hostApplications(limit: 0, offset: 0, status: APPROVED) {
        totalCount
      }
      rejected: hostApplications(limit: 0, offset: 0, status: REJECTED) {
        totalCount
      }
    }
  }
`;

export const hostApplicationsQuery = gql`
  query HostApplications(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $orderBy: ChronologicalOrderInput
    $searchTerm: String
    $status: HostApplicationStatus
  ) {
    host(slug: $hostSlug) {
      id

      hostApplications(limit: $limit, offset: $offset, orderBy: $orderBy, status: $status, searchTerm: $searchTerm) {
        offset
        limit
        totalCount
        nodes {
          id
          message
          customData
          status
          createdAt
          account {
            id
            legacyId
            name
            slug
            website
            description
            type
            imageUrl(height: 96)
            createdAt
            ... on AccountWithHost {
              ...ProcessHostApplicationFields
            }
            memberInvitations(role: [ADMIN]) {
              id
              role
            }
            admins: members(role: ADMIN) {
              totalCount
              nodes {
                id
                account {
                  id
                  type
                  slug
                  name
                  imageUrl(height: 48)
                }
              }
            }
          }
        }
      }
    }
  }
  ${processApplicationAccountFields}
`;

export const processApplicationMutation = gql`
  mutation ProcessHostApplication(
    $host: AccountReferenceInput!
    $account: AccountReferenceInput!
    $action: ProcessHostApplicationAction!
    $message: String
  ) {
    processHostApplication(host: $host, account: $account, action: $action, message: $message) {
      account {
        id
        ... on AccountWithHost {
          ...ProcessHostApplicationFields
        }
      }
      conversation {
        id
        slug
      }
    }
  }
  ${processApplicationAccountFields}
`;
