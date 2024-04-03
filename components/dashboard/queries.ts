import { gql } from '../../lib/graphql/helpers';

import { accountNavbarFieldsFragment } from '../collective-navbar/fragments';

export const adminPanelQuery = gql`
  query Dashboard($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      createdAt
      slug
      name
      isHost
      type
      settings
      isArchived
      isActive
      isIncognito
      imageUrl(height: 256)
      duplicatedAccounts {
        totalCount
      }
      pendingExpenses: expenses(status: PENDING, direction: RECEIVED, includeChildrenExpenses: true, limit: 0) {
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
      }
      policies {
        id
        REQUIRE_2FA_FOR_ADMINS
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
        host {
          id
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
      ... on AccountWithHost {
        isApproved
      }
    }
  }
  ${accountNavbarFieldsFragment}
`;
