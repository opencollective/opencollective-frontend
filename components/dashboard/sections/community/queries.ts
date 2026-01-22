import { gql } from '@apollo/client';

import { accountHoverCardFieldsFragment } from '@/components/AccountHoverCard';
import { kycStatusFieldsFragment, kycVerificationFieldsFragment } from '@/components/kyc/graphql';
import { vendorFieldFragment } from '@/components/vendors/queries';

import { legalDocumentFieldsFragment } from '../legal-documents/HostDashboardTaxForms';

export const peopleHostDashboardQuery = gql`
  query PeopleHostDashboard(
    $slug: String!
    $offset: Int
    $limit: Int
    $relation: [CommunityRelationType!]
    $searchTerm: String
    $account: AccountReferenceInput
    $totalContributed: AmountRangeInput
    $totalExpended: AmountRangeInput
  ) {
    community(
      host: { slug: $slug }
      relation: $relation
      account: $account
      type: [INDIVIDUAL]
      searchTerm: $searchTerm
      totalContributed: $totalContributed
      totalExpended: $totalExpended
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
          kycStatus(requestedByAccount: { slug: $slug }) {
            ...KYCStatusFields
          }
        }
        communityStats(host: { slug: $slug }) {
          relations
          transactionSummary {
            year
            expenseTotalAcc {
              valueInCents
              currency
            }
            expenseCountAcc
            contributionTotalAcc {
              valueInCents
              currency
            }
            contributionCountAcc
          }
        }
      }
    }
  }
  ${kycStatusFieldsFragment}
`;

const communityAccountDetailActivityFieldsFragment = gql`
  fragment CommunityAccountDetailActivityFields on Activity {
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
`;

export const communityAccountDetailQuery = gql`
  query CommunityAccountDetail($accountId: String!, $hostSlug: String!, $isIndividual: Boolean!) {
    account(id: $accountId) {
      id
      legacyId
      slug
      name
      legalName
      type
      createdAt
      imageUrl
      ... on Organization {
        canBeVendorOf(host: { slug: $hostSlug })
      }
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
        kycStatus(requestedByAccount: { slug: $hostSlug }) {
          manual {
            ...KYCVerificationFields
          }
        }
        adminOf: memberOf(role: [ADMIN], accountType: [ORGANIZATION, VENDOR]) {
          nodes {
            id
            role
            createdAt
            account {
              id
              slug
              name
              type
              ...AccountHoverCardFields
              communityStats(host: { slug: $hostSlug }) {
                transactionSummary {
                  expenseTotalAcc {
                    valueInCents
                    currency
                  }
                  expenseCountAcc
                  contributionTotalAcc {
                    valueInCents
                    currency
                  }
                  contributionCountAcc
                }
              }
            }
          }
        }
      }
      ... on Vendor {
        ...VendorFields
      }
      members(role: [ADMIN, ACCOUNTANT, MEMBER, COMMUNITY_MANAGER]) {
        nodes {
          id
          role
          description
          createdAt
          account {
            id
            ...AccountHoverCardFields
          }
        }
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
      communityStats(host: { slug: $hostSlug }) {
        associatedCollectives {
          account {
            id
            isFrozen
            ...AccountHoverCardFields
          }
          relations
          firstInteractionAt
          transactionSummary {
            expenseTotal {
              valueInCents
              currency
            }
            expenseCount
            contributionTotal {
              valueInCents
              currency
            }
            contributionCount
          }
        }
        associatedOrganizations {
          account {
            id
            ...AccountHoverCardFields
          }
          relations
          firstInteractionAt
          transactionSummary {
            expenseTotal {
              valueInCents
              currency
            }
            expenseCount
            contributionTotal {
              valueInCents
              currency
            }
            contributionCount
          }
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

    host(slug: $hostSlug) {
      id
      legacyId
      slug
      hostedLegalDocuments(
        type: US_TAX_FORM
        account: { id: $accountId }
        limit: 1
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        totalCount
        nodes {
          ...LegalDocumentFields
        }
      }
    }

    firstActivity: activities(
      host: { slug: $hostSlug }
      individual: { id: $accountId }
      orderBy: { field: CREATED_AT, direction: ASC }
      limit: 1
    ) @include(if: $isIndividual) {
      nodes {
        ...CommunityAccountDetailActivityFields
      }
    }

    lastActivity: activities(
      host: { slug: $hostSlug }
      individual: { id: $accountId }
      orderBy: { field: CREATED_AT, direction: DESC }
      limit: 1
    ) @include(if: $isIndividual) {
      nodes {
        ...CommunityAccountDetailActivityFields
      }
    }
  }
  ${accountHoverCardFieldsFragment}
  ${kycVerificationFieldsFragment}
  ${legalDocumentFieldsFragment}
  ${communityAccountDetailActivityFieldsFragment}
  ${vendorFieldFragment}
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
            ...CommunityAccountDetailActivityFields
          }
        }
      }
    }
  }
  ${accountHoverCardFieldsFragment}
  ${communityAccountDetailActivityFieldsFragment}
`;

export const communityAccountExpensesDetailQuery = gql`
  query CommunityAccountExpensesDetail(
    $accountId: String!
    $host: AccountReferenceInput!
    $statsCurrency: Currency!
    $skipSubmittedExpenses: Boolean!
    $skipPaidExpenses: Boolean!
    $skipApprovedExpenses: Boolean!
    $submittedExpensesOffset: Int!
    $paidExpensesOffset: Int!
    $approvedExpensesOffset: Int!
    $defaultLimit: Int!
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
      submittedExpenses: expenses(
        direction: SUBMITTED
        host: $host
        limit: $defaultLimit
        offset: $submittedExpensesOffset
      ) @skip(if: $skipSubmittedExpenses) {
        totalCount
        limit
        offset
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
    paidExpenses: expenses(
      activity: { type: [COLLECTIVE_EXPENSE_PAID], individual: { id: $accountId } }
      host: $host
      limit: $defaultLimit
      offset: $paidExpensesOffset
      includeChildrenExpenses: true
    ) @skip(if: $skipPaidExpenses) {
      totalCount
      limit
      offset
      totalAmount {
        amount(currency: $statsCurrency) {
          valueInCents
          currency
        }
        amountsByCurrency {
          valueInCents
          currency
        }
      }
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
    approvedExpenses: expenses(
      activity: { type: [COLLECTIVE_EXPENSE_APPROVED], individual: { id: $accountId } }
      host: $host
      limit: $defaultLimit
      offset: $approvedExpensesOffset
      includeChildrenExpenses: true
    ) @skip(if: $skipApprovedExpenses) {
      totalCount
      limit
      offset
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
  ${accountHoverCardFieldsFragment}
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
  ${accountHoverCardFieldsFragment}
`;
