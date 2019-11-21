import gql from 'graphql-tag';
import * as fragments from './fragments';

export const getCollectivePageQuery = gql`
  query getCollectivePageQuery($slug: String!, $nbContributorsPerContributeCard: Int) {
    Collective(slug: $slug, throwIfMissing: false) {
      id
      slug
      path
      name
      description
      longDescription
      backgroundImage
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
      hostFeePercent
      image
      imageUrl
      canApply
      canContact
      stats {
        id
        balance
        yearlyBudget
        updates
        backers {
          id
          all
          users
          organizations
        }
      }
      parentCollective {
        id
        slug
        image
        twitterHandle
        type
      }
      host {
        id
        name
        slug
        type
      }
      coreContributors: contributors(roles: [ADMIN, MEMBER]) {
        ...ContributorsFieldsFragment
      }
      financialContributors: contributors(roles: [BACKER], limit: 150) {
        ...ContributorsFieldsFragment
      }
      tiers {
        id
        name
        slug
        description
        hasLongDescription
        goal
        interval
        currency
        amount
        minimumAmount
        button
        amountType
        endsAt
        type
        stats {
          id
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
        }
      }
      events(includePastEvents: true) {
        id
        slug
        name
        description
        image
        startsAt
        endsAt
        backgroundImageUrl(height: 208)
        contributors(limit: $nbContributorsPerContributeCard, roles: [BACKER, ATTENDEE]) {
          id
          image
          collectiveSlug
          name
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
      childCollectives {
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
      ...TransactionsAndExpensesFragment
      updates(limit: 3, onlyPublishedUpdates: true) {
        ...UpdatesFieldsFragment
      }
    }
  }

  ${fragments.TransactionsAndExpensesFragment}
  ${fragments.UpdatesFieldsFragment}
  ${fragments.ContributorsFieldsFragment}
`;
