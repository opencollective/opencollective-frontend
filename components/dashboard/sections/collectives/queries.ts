import { gql } from '../../../../lib/graphql/helpers';

import { accountHoverCardFields } from '../../../AccountHoverCard';

const processApplicationAccountFields = gql`
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
            imageUrl
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
                  imageUrl
                  ...AccountHoverCardFields
                  emails
                }
              }
            }
            ...AccountHoverCardFields
          }
        }
      }
    }
  }
  ${processApplicationAccountFields}
  ${accountHoverCardFields}
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

const hostedCollectiveFields = gql`
  fragment HostedCollectiveFields on Account {
    id
    legacyId
    name
    slug
    website
    type
    currency
    imageUrl(height: 96)
    isFrozen
    tags
    settings
    createdAt
    stats {
      id
      balance {
        valueInCents
        currency
      }
    }
    ... on AccountWithHost {
      hostFeesStructure
      hostFeePercent
      approvedAt
      hostAgreements {
        totalCount
        nodes {
          id
          title
          attachment {
            id
            url
            name
            type
          }
        }
      }
      host {
        id
        legacyId
        name
      }
    }
    ... on AccountWithContributions {
      totalFinancialContributors
    }
    childrenAccounts {
      nodes {
        id
        slug
        name
        type
        stats {
          id
          balance {
            valueInCents
            currency
          }
        }
        ... on AccountWithHost {
          hostFeesStructure
          hostFeePercent
          approvedAt
        }
        members(role: [ADMIN]) {
          nodes {
            id
            account {
              id
              ...AccountHoverCardFields
              emails
            }
          }
        }
      }
    }
    members(role: [ADMIN]) {
      nodes {
        id
        account {
          id
          ...AccountHoverCardFields
          emails
        }
      }
    }
    ... on AccountWithParent {
      parent {
        id
        slug
        name
        ...AccountHoverCardFields
      }
    }
  }
  ${accountHoverCardFields}
`;

export const hostedCollectivesMetadataQuery = gql`
  query HostedCollectivesMetadata($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      all: hostedAccounts(limit: 1, accountType: [COLLECTIVE, FUND]) {
        totalCount
      }
      active: hostedAccounts(limit: 1, accountType: [COLLECTIVE, FUND], isFrozen: false) {
        totalCount
      }
      frozen: hostedAccounts(limit: 1, isFrozen: true) {
        totalCount
      }
      unhosted: hostedAccounts(limit: 1, accountType: [COLLECTIVE, FUND], isUnhosted: true) {
        totalCount
      }
    }
  }
`;

// TODO: This query is using `legacyId` for host and member.account to interface with the
// legacy `AddFundsForm`. Once the new add funds form will be implemented, we can remove these fields.
export const hostedCollectivesQuery = gql`
  query HostedCollectives(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $orderBy: OrderByInput
    $hostFeesStructure: HostFeeStructure
    $searchTerm: String
    $type: [AccountType]
    $isApproved: Boolean
    $isFrozen: Boolean
    $isUnhosted: Boolean
  ) {
    host(slug: $hostSlug) {
      id
      legacyId
      slug
      name
      currency
      isHost
      type
      settings
      hostFeePercent
      plan {
        id
        hostFees
        hostFeeSharePercent
      }
      hostedAccounts(
        limit: $limit
        offset: $offset
        searchTerm: $searchTerm
        hostFeesStructure: $hostFeesStructure
        accountType: $type
        orderBy: $orderBy
        isApproved: $isApproved
        isFrozen: $isFrozen
        isUnhosted: $isUnhosted
      ) {
        offset
        limit
        totalCount
        nodes {
          id
          ...HostedCollectiveFields
        }
      }
    }
  }

  ${hostedCollectiveFields}
`;

export const hostedCollectiveDetailQuery = gql`
  query HostedCollectiveDetail($id: String!) {
    account(id: $id) {
      id
      ...HostedCollectiveFields
    }
  }

  ${hostedCollectiveFields}
`;
