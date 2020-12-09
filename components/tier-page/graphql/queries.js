import { gql } from '@apollo/client';

import { collectiveNavbarFieldsFragment } from '../../collective-page/graphql/fragments';

export const tierPageQuery = gql`
  query TierPage($tierId: Int!) {
    Tier(id: $tierId) {
      id
      name
      slug
      description
      longDescription
      videoUrl
      goal
      currency
      interval
      endsAt
      button

      stats {
        id
        totalDonated
        totalRecurringDonations
        contributors {
          id
          all
          collectives
          organizations
          users
        }
      }

      collective {
        id
        slug
        type
        name
        backgroundImage
        settings
        currency
        isArchived
        path
        host {
          id
        }
        stats {
          id
          updates
          balance
          transactions {
            id
            all
          }
        }
        features {
          ...NavbarFields
        }
        admins: members(role: "ADMIN") {
          id
          role
          collective: member {
            id
            type
            slug
            name
            image
          }
        }
        parentCollective {
          id
          twitterHandle
          image
        }
      }

      contributors {
        id
        name
        roles
        isAdmin
        isCore
        isBacker
        isFundraiser
        since
        description
        publicMessage
        collectiveSlug
        totalAmountDonated
        type
        isIncognito
        collectiveId
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
`;
