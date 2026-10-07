import { gql } from '@apollo/client';

import type {
  AccountWithHost,
  AccountWithParent,
  CommunityAccountDetailQuery,
  HostedAccountProfileQuery,
} from '@/lib/graphql/types/v2/graphql';

import { accountHoverCardFields } from '@/components/AccountHoverCard';
import { kycStatusFields, kycVerificationFields } from '@/components/kyc/graphql';
import { vendorFieldFragment } from '@/components/vendors/queries';

import { hostedCollectiveFields } from '../collectives/queries';
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
            kind
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
      mainProfile {
        id
        name
        slug
        type
        imageUrl
        ...AccountHoverCardFields
      }
    }
    fromAccount {
      id
      ...AccountHoverCardFields
      mainProfile {
        id
        name
        slug
        type
        imageUrl
        ...AccountHoverCardFields
      }
    }
    individual {
      id
      isIncognito
      ...AccountHoverCardFields
      mainProfile {
        id
        name
        slug
        type
        imageUrl
        ...AccountHoverCardFields
      }
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
  query CommunityAccountDetail($accountId: String!, $hostSlug: String!) {
    account(id: $accountId) {
      id
      publicId
      legacyId
      slug
      name
      legalName
      taxableCountry
      isUSEntity
      type
      createdAt
      # imageUrl comes from ...HostedCollectiveFields (resized variant)
      hasPublicProfile
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
      isArchived
      pendingExpenses: expenses(
        status: [PENDING, APPROVED, ON_HOLD, INCOMPLETE, ERROR]
        direction: SUBMITTED
        host: { slug: $hostSlug }
      ) {
        totalCount
      }
      spamExpenses: expenses(status: [SPAM], direction: SUBMITTED, host: { slug: $hostSlug }) {
        totalCount
      }
      rejectedExpenses: expenses(status: [REJECTED], direction: SUBMITTED, host: { slug: $hostSlug }) {
        totalCount
      }
      communityStats(host: { slug: $hostSlug }) {
        id
        relations
        transactionSummary {
          kind
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
      }
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
      # Hosted account fields (migrated from components/hosted-account-overview/queries.ts)
      description
      longDescription
      updates(includeChildren: true, onlyPublishedUpdates: true, limit: 0) {
        totalCount
      }
      firstTransaction: transactions(
        limit: 1
        offset: 0
        orderBy: { field: CREATED_AT, direction: ASC }
        includeChildrenTransactions: true
      ) {
        nodes {
          id
          ...CommunityAccountDetailTransaction
        }
      }
      recentContributions: transactions(
        limit: 5
        offset: 0
        type: CREDIT
        kind: [CONTRIBUTION, ADDED_FUNDS]
        includeChildrenTransactions: true
      ) {
        nodes {
          id
          ...CommunityAccountDetailTransaction
        }
      }
      recentPayouts: transactions(
        limit: 5
        offset: 0
        type: DEBIT
        kind: [EXPENSE]
        includeChildrenTransactions: true
      ) {
        nodes {
          id
          ...CommunityAccountDetailTransaction
        }
      }
      # Extra fields on children (merged with HostedCollectiveFields' childrenAccounts):
      # the host enables the same row actions (MoreActionsMenu) as the main account.
      childrenAccounts {
        nodes {
          id
          ... on AccountWithHost {
            host {
              id
              legacyId
              name
              slug
              imageUrl
            }
          }
        }
      }
      ...HostedCollectiveFields
    }
    host(slug: $hostSlug) {
      id
      publicId
      legacyId
      slug
      name
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
      policies {
        id
        USE_VENDOR_POLICY
      }
      # Hosted account fields (migrated from components/hosted-account-overview/queries.ts)
      type
      hostFeePercent
      hostedAccountAgreements(accounts: [{ id: $accountId }], includeChildren: true, limit: 0) {
        totalCount
      }
    }

    firstActivity: activities(
      host: { slug: $hostSlug }
      account: [{ id: $accountId }]
      orderBy: { field: CREATED_AT, direction: ASC }
      limit: 1
    ) {
      nodes {
        ...CommunityAccountDetailActivityFields
      }
    }

    lastActivity: activities(
      host: { slug: $hostSlug }
      account: [{ id: $accountId }]
      orderBy: { field: CREATED_AT, direction: DESC }
      limit: 1
    ) {
      nodes {
        ...CommunityAccountDetailActivityFields
      }
    }
  }

  fragment CommunityAccountDetailTransaction on Transaction {
    id
    clearedAt
    createdAt
    type
    kind
    description
    amount {
      valueInCents
      currency
    }
    netAmount {
      valueInCents
      currency
    }
    account {
      id
      slug
      name
      imageUrl
    }
    oppositeAccount {
      id
      slug
      name
      imageUrl
    }
    expense {
      id
      legacyId
    }
    order {
      id
      legacyId
    }
  }

  ${kycVerificationFields}
  ${legalDocumentFields}
  ${communityAccountDetailActivityFields}
  ${vendorFieldFragment}
  # AccountHoverCardFields is embedded in hostedCollectiveFields (kept once in the document)
  ${hostedCollectiveFields}
`;

export const communityAccountOverviewQuery = gql`
  query CommunityAccountOverview($accountId: String!, $hostSlug: String!) {
    account(id: $accountId) {
      id
      slug
      name
      hasPublicProfile
      communityStats(host: { slug: $hostSlug }) {
        id
        relations
        transactionSummary {
          kind
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

// Interim data types for the unified detail query: the generated `CommunityAccountDetailQuery`
// predates the hosted account fields merged into the document above. After the next
// `npm run graphql:update` these collapse to the generated types (drop the
// `HostedAccountProfileQuery` half, which disappears with hosted-account-overview).
export type AccountDetailData = NonNullable<CommunityAccountDetailQuery['account']> &
  NonNullable<HostedAccountProfileQuery['account']> &
  Partial<AccountWithHost> &
  Partial<AccountWithParent>;

export type AccountDetailHost = NonNullable<CommunityAccountDetailQuery['host']> &
  NonNullable<HostedAccountProfileQuery['host']>;
