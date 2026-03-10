import { gql } from '@apollo/client';

import { accountHoverCardFields } from '@/components/AccountHoverCard';
import { kycStatusFields, kycVerificationFields } from '@/components/kyc/graphql';
import { vendorFieldFragment } from '@/components/vendors/queries';

import { legalDocumentFields } from '../legal-documents/HostDashboardTaxForms';

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
    $orderBy: OrderByInput
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
      orderBy: $orderBy
    ) {
      limit
      offset
      nodes {
        id
        legacyId
        publicId
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
            debitTotal {
              valueInCents
              currency
            }
            debitCount
            creditTotal {
              valueInCents
              currency
            }
            creditCount
          }
        }
      }
    }
  }
  ${kycStatusFields}
`;

const communityAccountDetailActivityFields = gql`
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
      publicId
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
        adminOf: memberOf(role: [ADMIN], accountType: [ORGANIZATION, VENDOR, COLLECTIVE, FUND]) {
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
            }
          }
        }
      }
      ... on Vendor {
        ...VendorFields
      }
      admins: members(role: [ADMIN]) {
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
    }
    host(slug: $hostSlug) {
      id
      publicId
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
      features {
        id
        MULTI_CURRENCY_EXPENSES
      }
      requiredLegalDocuments
      currency
      transferwise {
        id
        availableCurrencies
      }
      supportedPayoutMethods
      isTrustedHost
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
  ${accountHoverCardFields}
  ${kycVerificationFields}
  ${legalDocumentFields}
  ${communityAccountDetailActivityFields}
  ${vendorFieldFragment}
`;

export const communityAccountOverviewQuery = gql`
  query CommunityAccountOverview($accountId: String!, $hostSlug: String!) {
    account(id: $accountId) {
      id
      communityStats(host: { slug: $hostSlug }) {
        relations
        transactionSummary {
          debitCount
          creditCount
          debitTotal {
            valueInCents
            currency
          }
          creditTotal {
            valueInCents
            currency
          }
        }
        creditTimeSeries: transactionSummaryTimeSeries(type: CREDIT) {
          dateFrom
          dateTo
          timeUnit
          nodes {
            date
            amount {
              valueInCents
              currency
            }
            count
          }
        }
        debitTimeSeries: transactionSummaryTimeSeries(type: DEBIT) {
          dateFrom
          dateTo
          timeUnit
          nodes {
            date
            amount {
              valueInCents
              currency
            }
            count
          }
        }
        lastInteractionAt
        firstInteractionAt
      }
    }
    recentMoneyIn: transactions(
      fromAccount: { id: $accountId }
      host: { slug: $hostSlug }
      limit: 5
      orderBy: { field: CREATED_AT, direction: DESC }
      kind: [CONTRIBUTION, ADDED_FUNDS, EXPENSE]
      type: CREDIT
    ) {
      nodes {
        id
        legacyId
        description
        type
        kind
        createdAt
        order {
          legacyId
        }
        toAccount {
          id
          name
          slug
          imageUrl
          type
        }
        fromAccount {
          id
          name
          slug
          imageUrl
          type
        }
        amount {
          valueInCents
          currency
        }
      }
    }
    recentMoneyOut: transactions(
      fromAccount: { id: $accountId }
      host: { slug: $hostSlug }
      limit: 5
      orderBy: { field: CREATED_AT, direction: DESC }
      kind: [EXPENSE, ADDED_FUNDS]
      type: DEBIT
    ) {
      nodes {
        id
        legacyId
        description
        type
        kind
        createdAt
        expense {
          legacyId
        }
        toAccount {
          id
          name
          slug
          imageUrl
          type
        }
        fromAccount {
          id
          name
          slug
          imageUrl
          type
        }
        amount {
          valueInCents
          currency
        }
      }
    }
  }
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
  ${accountHoverCardFields}
  ${communityAccountDetailActivityFields}
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
          debitTotal {
            valueInCents
            currency
          }
          debitCount
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
          creditTotal {
            valueInCents
            currency
          }
          creditCount
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
