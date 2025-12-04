import { gql } from '@apollo/client';

import { accountHoverCardFields } from '@/components/AccountHoverCard';

export const peopleHostDashboardQuery = gql`
  query PeopleHostDashboard(
    $slug: String!
    $offset: Int
    $limit: Int
    $relation: [CommunityRelationType!]
    $searchTerm: String
    $account: AccountReferenceInput
  ) {
    community(
      host: { slug: $slug }
      relation: $relation
      account: $account
      type: [INDIVIDUAL]
      searchTerm: $searchTerm
      offset: $offset
      limit: $limit
    ) {
      totalCount
      limit
      offset
      nodes {
        id
        legacyId
        slug
        name
        legalName
        type
        imageUrl
        isIncognito

        ... on Individual {
          isGuest
          email
          location {
            country
          }
        }
        communityStats(host: { slug: $slug }) {
          relations
        }
      }
    }
  }
`;

export const communityAccountDetailQuery = gql`
  query CommunityAccountDetail($accountId: String!, $host: AccountReferenceInput!) {
    account(id: $accountId) {
      id
      legacyId
      slug
      name
      legalName
      type
      createdAt
      imageUrl
      socialLinks {
        type
        url
      }
      location {
        id
        country
        address
      }
      isVerified
      ... on Individual {
        email
      }
      memberOf {
        nodes {
          id
          role
          account {
            id
            type
            ...AccountHoverCardFields
            ... on AccountWithHost {
              host {
                id
                slug
                name
                type
                imageUrl
              }
            }
          }
        }
      }
      communityStats(host: $host) {
        associatedCollectives {
          account {
            id
            isFrozen
            ...AccountHoverCardFields
          }
          relations
        }
        relations
        transactionSummary {
          year
          expenseCountAcc
          contributionCountAcc
        }
        lastInteractionAt
        firstInteractionAt
      }
    }
  }
  ${accountHoverCardFields}
`;

export const communityAccountActivitiesQuery = gql`
  query CommunityAccountActivities($accountId: String!, $host: AccountReferenceInput!, $limit: Int!, $offset: Int!) {
    account(id: $accountId) {
      communityStats(host: $host) {
        activities(offset: $offset, limit: $limit) {
          totalCount
          limit
          offset
          nodes {
            id
            type
            createdAt
            data
            isSystem
            account {
              id
              ...AccountHoverCardFields
            }
            fromAccount {
              id
              ...AccountHoverCardFields
            }
            individual {
              id
              isIncognito
              ...AccountHoverCardFields
            }
            expense {
              id
              legacyId
              description
              amountV2 {
                valueInCents
                currency
              }
              payee {
                id
                name
                slug
                imageUrl
                ...AccountHoverCardFields
              }
              account {
                id
                name
                type
                slug
                ...AccountHoverCardFields
                ... on AccountWithParent {
                  parent {
                    id
                    slug
                  }
                }
              }
            }
            order {
              id
              legacyId
              description
              toAccount {
                id
                name
                slug
                ... on AccountWithParent {
                  parent {
                    id
                    slug
                  }
                }
              }
            }
            update {
              id
              legacyId
              title
              summary
              slug
            }
            conversation {
              id
              title
              summary
              slug
            }
          }
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

export const communityAccountExpensesDetailQuery = gql`
  query CommunityAccountExpensesDetail(
    $accountId: String!
    $host: AccountReferenceInput!
    $limit: Int!
    $offset: Int!
  ) {
    account(id: $accountId) {
      id
      legacyId
      communityStats(host: $host) {
        transactionSummary {
          year
          expenseTotal {
            valueInCents
            currency
          }
          expenseCount
          expenseTotalAcc {
            valueInCents
            currency
          }
          expenseCountAcc
        }
      }
      expenses(direction: SUBMITTED, host: $host, limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          legacyId
          description
          status
          type
          tags
          accountingCategory {
            id
            name
            code
          }
          amount: amountV2(currencySource: HOST) {
            valueInCents
            currency
          }
          createdAt
          account {
            id
            ...AccountHoverCardFields
          }
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

export const communityAccountContributionsDetailQuery = gql`
  query CommunityAccountContributionsDetail(
    $accountId: String!
    $host: AccountReferenceInput!
    $limit: Int!
    $offset: Int!
  ) {
    account(id: $accountId) {
      id
      legacyId
      communityStats(host: $host) {
        transactionSummary {
          year
          contributionTotal {
            valueInCents
            currency
          }
          contributionCount
          contributionTotalAcc {
            valueInCents
            currency
          }
          contributionCountAcc
        }
      }
      orders(host: $host, limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          legacyId
          description
          status
          tags
          accountingCategory {
            id
            name
            code
          }
          totalContributed {
            valueInCents
            currency
          }
          createdAt
          toAccount {
            id
            ...AccountHoverCardFields
          }
        }
      }
    }
  }
  ${accountHoverCardFields}
`;
