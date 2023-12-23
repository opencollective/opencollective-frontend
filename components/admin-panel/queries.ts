import { gql } from '../../lib/graphql/helpers';

import { accountNavbarFieldsFragment } from '../collective-navbar/fragments';

export const adminPanelQuery = gql`
  query AdminPanel($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      slug
      name
      isHost
      type
      settings
      isArchived
      isIncognito
      imageUrl(height: 256)
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
