import { gqlV1 } from '../../../lib/graphql/helpers';

import { collectiveNavbarFieldsFragment } from '../../collective-page/graphql/fragments';

export const tierPageQuery = gqlV1/* GraphQL */ `
  query TierPage($tierId: Int!) {
    Tier(id: $tierId) {
      id
      name
      slug
      description
      longDescription
      videoUrl
      goal
      type
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
        backgroundImageUrl
        imageUrl
        isHost
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
          id
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
          slug
          twitterHandle
          image
          backgroundImageUrl
          imageUrl
        }
      }

      contributors {
        id
        name
        roles
        isAdmin
        isCore
        isBacker
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
