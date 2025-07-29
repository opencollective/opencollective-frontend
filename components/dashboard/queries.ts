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
      isHost
      type
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
      issuedGrantRequests: expenses(direction: SUBMITTED, limit: 0, type: GRANT) {
        totalCount
      }
      pausedIncomingContributions: orders(filter: INCOMING, status: PAUSED, includeIncognito: true) {
        totalCount
      }
      pausedOutgoingContributions: orders(filter: OUTGOING, status: PAUSED, includeIncognito: true) {
        totalCount
      }
      ... on AccountWithContributions {
        canStartResumeContributionsProcess
        hasResumeContributionsProcessStarted
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
      }
      policies {
        id
        REQUIRE_2FA_FOR_ADMINS
      }
      ... on Organization {
        host {
          id
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
        host {
          id
          requiredLegalDocuments
          legacyId
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
