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
          manualPaymentProviders {
            id
            name
          }
        }
      }
      ... on Host {
        manualPaymentProviders {
          id
          name
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
          manualPaymentProviders {
            id
            name
          }
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
