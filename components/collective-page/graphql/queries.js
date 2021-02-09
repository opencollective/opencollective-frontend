import { gql } from '@apollo/client';

import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from '../../contribute-cards/Contribute';

import * as fragments from './fragments';

export const collectivePageQuery = gql`
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
      githubHandle
      website
      tags
      company
      type
      currency
      settings
      isActive
      isPledged
      isApproved
      isArchived
      isHost
      isIncognito
      isGuest
      hostFeePercent
      platformFeePercent
      image
      imageUrl(height: 256)
      canApply
      canContact
      features {
        ...NavbarFields
      }
      ordersFromCollective(subscriptionsOnly: true) {
        isSubscriptionActive
      }
      memberOf(onlyActiveCollectives: true, limit: 1) {
        id
      }
      stats {
        id
        balance
        yearlyBudget
        updates
        activeRecurringContributions
        totalAmountReceived(periodInMonths: 12)
        totalAmountRaised: totalAmountReceived
        backers {
          id
          all
          users
          organizations
        }
        transactions {
          all
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
          ...ContributorsFields
        }
      }
      host {
        id
        name
        slug
        type
        settings
        plan {
          id
          hostFees
        }
      }
      coreContributors: contributors(roles: [ADMIN, MEMBER]) {
        ...ContributorsFields
      }
      financialContributors: contributors(roles: [BACKER], limit: 150) {
        ...ContributorsFields
      }
      tiers {
        id
        name
        slug
        description
        useStandalonePage
        goal
        interval
        currency
        amount
        minimumAmount
        button
        amountType
        endsAt
        type
        maxQuantity
        stats {
          id
          availableQuantity
          totalDonated
          totalRecurringDonations
          contributors {
            id
            all
            users
            organizations
          }
        }
        contributors(limit: $nbContributorsPerContributeCard) {
          id
          image
          collectiveSlug
          name
          type
          isGuest
        }
      }
      events(includePastEvents: true, includeInactive: true) {
        id
        slug
        name
        description
        image
        isActive
        startsAt
        endsAt
        backgroundImageUrl(height: 208)
        contributors(limit: $nbContributorsPerContributeCard, roles: [BACKER, ATTENDEE]) {
          id
          image
          collectiveSlug
          name
          type
          isGuest
        }
        stats {
          id
          backers {
            id
            all
            users
            organizations
          }
        }
      }
      projects {
        id
        slug
        name
        description
        image
        isActive
        backgroundImageUrl(height: 208)
        contributors(limit: $nbContributorsPerContributeCard, roles: [BACKER]) {
          id
          name
          image
          collectiveSlug
          type
        }
        stats {
          id
          backers {
            id
            all
            users
            organizations
          }
        }
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
            image
            collectiveSlug
            name
            type
          }
        }
      }
      updates(limit: 3, onlyPublishedUpdates: true) {
        ...UpdatesFields
      }
      plan {
        id
        hostedCollectives
        hostedCollectivesLimit
      }

      ... on Event {
        timezone
        startsAt
        endsAt
        location {
          name
          address
          country
          lat
          long
        }
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

  ${fragments.updatesFieldsFragment}
  ${fragments.contributorsFieldsFragment}
  ${fragments.collectiveNavbarFieldsFragment}
`;

export const getCollectivePageQueryVariables = slug => {
  return {
    slug: slug,
    nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD,
  };
};
