import { gql } from '../../lib/graphql/helpers';

import { accountNavbarFieldsFragment } from '../collective-navbar/fragments';

export const adminPanelQuery = gql`
  query Dashboard($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      createdAt
      currency
      slug
      name
      legalName
      isHost
      type
      supportedExpenseTypes
      settings
      isArchived
      isActive
      isIncognito
      imageUrl(height: 256)
      canHaveChangelogUpdates
      connectedAccounts {
        id
        hash
        service
      }
      duplicatedAccounts {
        totalCount
      }
      pendingExpenses: expenses(
        status: PENDING
        direction: RECEIVED
        includeChildrenExpenses: true
        limit: 0
        types: [INVOICE, RECEIPT, FUNDING_REQUEST, UNCLASSIFIED, CHARGE, SETTLEMENT]
      ) {
        totalCount
      }
      pendingGrants: expenses(
        status: PENDING
        direction: RECEIVED
        includeChildrenExpenses: true
        limit: 0
        type: GRANT
      ) {
        totalCount
      }
      receivedGrantRequests: expenses(direction: RECEIVED, limit: 0, type: GRANT) {
        totalCount
      }
      issuedGrantRequests: expenses(direction: SUBMITTED, limit: 0, type: GRANT) {
        totalCount
      }
      pausedResumableIncomingContributions: orders(
        filter: INCOMING
        status: [PAUSED]
        includeIncognito: true
        includeHostedAccounts: false
        includeChildrenAccounts: true
        pausedBy: [COLLECTIVE, HOST, PLATFORM]
      ) {
        totalCount
      }
      pausedOutgoingContributions: orders(filter: OUTGOING, status: PAUSED, includeIncognito: true) {
        totalCount
      }
      ... on AccountWithContributions {
        canStartResumeContributionsProcess
        hasResumeContributionsProcessStarted
      }
      ... on AccountWithPlatformSubscription {
        platformSubscription {
          plan {
            title
          }
        }
      }
      childrenAccounts {
        totalCount
        nodes {
          id
          slug
          name
          type
        }
      }
      features {
        id
        ...NavbarFields
        VIRTUAL_CARDS
        USE_PAYMENT_METHODS
        EMIT_GIFT_CARDS
        OFF_PLATFORM_TRANSACTIONS
        TAX_FORMS
        CHART_OF_ACCOUNTS
        PAYPAL_PAYOUTS
        TRANSFERWISE
        AGREEMENTS
        FUNDS_GRANTS_MANAGEMENT
        EXPECTED_FUNDS
        CHARGE_HOSTING_FEES
        KYC
        PERSONA_KYC
      }
      policies {
        id
        REQUIRE_2FA_FOR_ADMINS
      }
      ... on Organization {
        hasHosting
        hasMoneyManagement
        host {
          id
          type
          slug
          legacyId
          requiredLegalDocuments
          hostFeePercent
        }
      }
      ... on AccountWithParent {
        parent {
          id
          slug
          policies {
            id
            REQUIRE_2FA_FOR_ADMINS
          }
        }
      }
      ... on AccountWithHost {
        hostFeePercent
        isApproved
        approvedAt
        hostApplication {
          id
          createdAt
          status
        }
        host {
          id
          requiredLegalDocuments
          legacyId
          type
          slug
          name
          settings
          policies {
            id
            EXPENSE_AUTHOR_CANNOT_APPROVE {
              enabled
              amountInCents
              appliesToHostedCollectives
              appliesToSingleAdminCollectives
            }
            COLLECTIVE_MINIMUM_ADMINS {
              numberOfAdmins
              applies
              freeze
            }
          }
        }
      }
    }
  }
  ${accountNavbarFieldsFragment}
`;
