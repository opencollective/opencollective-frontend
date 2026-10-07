import { gql } from '@apollo/client';

import type { CommunityAccountDetailQuery } from '@/lib/graphql/types/v2/graphql';

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
      isArchived
      spamExpenses: expenses(status: [SPAM], direction: SUBMITTED, host: { slug: $hostSlug }) {
        totalCount
      }
      rejectedExpenses: expenses(status: [REJECTED], direction: SUBMITTED, host: { slug: $hostSlug }) {
        totalCount
      }
      communityStats(host: { slug: $hostSlug }) {
        id
        relations
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
            account {
              ...AccountHoverCardFields
            }
          }
        }
      }
      ... on Vendor {
        ...VendorFields
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
      requiredLegalDocuments
      policies {
        id
        USE_VENDOR_POLICY
      }
      hostFeePercent
      hostedAccountAgreements(accounts: [{ id: $accountId }], includeChildren: true, limit: 0) {
        totalCount
      }
    }
  }

  fragment CommunityAccountDetailTransaction on Transaction {
    id
    clearedAt
    createdAt
    type
    netAmount {
      valueInCents
      currency
    }
    expense {
      legacyId
    }
    order {
      legacyId
    }
  }

  ${kycVerificationFields}
  ${legalDocumentFields}
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

export type AccountDetailData = NonNullable<CommunityAccountDetailQuery['account']>;

export type AccountDetailHost = NonNullable<CommunityAccountDetailQuery['host']>;

/**
 * `AccountDetailData` narrowed to the hosted account flow (collectives, funds,
 * projects, events), which is where the `AccountWithHost` facets (`host`,
 * `hostFeePercent`, `hostFeesStructure`, `approvedAt`) live. `parent` only exists
 * on projects and events.
 */
export type HostedAccountDetailData = Extract<
  AccountDetailData,
  { __typename?: 'Collective' | 'Fund' | 'Project' | 'Event' }
>;
