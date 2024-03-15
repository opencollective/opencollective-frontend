import { gqlV1 } from '../../../lib/graphql/helpers';

import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from '../../contribute-cards/constants';

import * as fragments from './fragments';

export const collectivePageQuery = gqlV1/* GraphQL */ `
  query CollectivePage($slug: String!, $nbContributorsPerContributeCard: Int) {
    Collective(slug: $slug, throwIfMissing: false) {
      id
      slug
      path
      name
      description
      longDescription
      backgroundImage
      backgroundImageUrl
      twitterHandle
      duplicatedCollectives(limit: 1) {
        collectives {
          id
          slug
          name
          type
        }
      }
      repositoryUrl
      website
      socialLinks {
        type
        url
      }
      location {
        id
        country
      }
      tags
      company
      type
      currency
      settings
      isActive
      isApproved
      isArchived
      isFrozen
      isHost
      isIncognito
      isGuest
      hostFeePercent
      platformFeePercent
      image
      imageUrl(height: 256)
      canApply
      canContact
      supportedExpenseTypes
      features {
        id
        ...NavbarFields
      }
      ordersFromCollective(subscriptionsOnly: true) {
        id
        isSubscriptionActive
      }
      memberOf(onlyActiveCollectives: true, limit: 1) {
        id
      }
      stats {
        id
        balance
        yearlyBudget
        backers {
          id
          all
          users
          organizations
        }
      }
      connectedTo: memberOf(role: "CONNECTED_COLLECTIVE", limit: 1) {
        id
        collective {
          id
          name
          type
          slug
        }
      }
      parentCollective {
        id
        name
        slug
        image
        backgroundImageUrl
        twitterHandle
        type
        coreContributors: contributors(roles: [ADMIN, MEMBER]) {
          id
          ...ContributorsFields
        }
      }
      host {
        id
        name
        slug
        type
        location {
          id
          country
        }
        settings
        plan {
          id
          hostFees
          hostFeeSharePercent
        }
        features {
          id
          VIRTUAL_CARDS
        }
        policies {
          id
          COLLECTIVE_MINIMUM_ADMINS {
            freeze
            numberOfAdmins
          }
        }
      }
      coreContributors: contributors(roles: [ADMIN, MEMBER]) {
        id
        ...ContributorsFields
      }
      financialContributors: contributors(roles: [BACKER], limit: 150) {
        id
        ...ContributorsFields
      }
      tiers {
        id
        ...ContributeCardTierFields
      }
      events(includePastEvents: true, includeInactive: true) {
        id
        ...ContributeCardEventFields
      }
      projects {
        id
        ...ContributeCardProjectFields
      }
      admins: members(role: "ADMIN") {
        id
      }
      connectedCollectives: members(role: "CONNECTED_COLLECTIVE") {
        id
        collective: member {
          id
          slug
          name
          type
          description
          backgroundImageUrl(height: 208)
          stats {
            id
            backers {
              id
              all
              users
              organizations
            }
          }
          contributors(limit: $nbContributorsPerContributeCard) {
            id
            ...ContributeCardContributorFields
          }
        }
      }
      plan {
        id
        hostedCollectives
      }

      ... on Event {
        timezone
        startsAt
        endsAt
        location {
          id
          name
          address
          country
          lat
          long
        }
        privateInstructions
        orders {
          id
          createdAt
          quantity
          publicMessage
          fromCollective {
            id
            type
            name
            company
            image
            isIncognito
            imageUrl
            slug
            twitterHandle
            description
            ... on User {
              email
            }
          }
          tier {
            id
            name
            type
          }
        }
      }
    }
  }

  ${fragments.contributorsFieldsFragment}
  ${fragments.collectiveNavbarFieldsFragment}
  ${fragments.contributeCardTierFieldsFragment}
  ${fragments.contributeCardEventFieldsFragment}
  ${fragments.contributeCardProjectFieldsFragment}
`;

export const getCollectivePageQueryVariables = slug => {
  return {
    slug: slug,
    nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD,
  };
};
