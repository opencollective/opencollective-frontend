import { gql } from '../../../../lib/graphql/helpers';

/**
 * Fields fetched for contributors
 */
const contributorsFieldsFragment = gql`
  fragment ContributorsFields on Contributor {
    id
    name
    roles
    isAdmin
    isCore
    isBacker
    since
    image
    description
    collectiveSlug
    totalAmountDonated
    type
    publicMessage
    isIncognito
    # TODO
    # isGuest
    # tiersIds
    # collectiveId
  }
`;

/**
 * Fields fetched for contributors
 */
const membersFieldsFragment = gql`
  fragment MembersFields on Member {
    id
    role
    account {
      name
      imageUrl
    }
    # name
    # roles
    # isAdmin
    # isCore
    # isBacker
    since
    # image
    description
    # collectiveSlug
    # totalAmountDonated
    # type
    publicMessage
    # isIncognito
    # TODO
    # isGuest
    # tiersIds
    # collectiveId
  }
`;

/**
 * Fields fetched for all possible collective page features
 */
const collectiveNavbarFieldsFragment = gql`
  fragment NavbarFields on CollectiveFeatures {
    id
    ABOUT
    CONNECTED_ACCOUNTS
    RECEIVE_FINANCIAL_CONTRIBUTIONS
    RECURRING_CONTRIBUTIONS
    EVENTS
    PROJECTS
    USE_EXPENSES
    RECEIVE_EXPENSES
    COLLECTIVE_GOALS
    TOP_FINANCIAL_CONTRIBUTORS
    CONVERSATIONS
    UPDATES
    TEAM
    CONTACT_FORM
    RECEIVE_HOST_APPLICATIONS
    HOST_DASHBOARD
    TRANSACTIONS
    REQUEST_VIRTUAL_CARDS
  }
`;

const contributeCardContributorFieldsFragment = gql`
  fragment ContributeCardContributorFields on Contributor {
    id
    image(height: 64)
    collectiveSlug
    name
    type
    # TODO
    # isGuest
  }
`;

const contributeCardTierFieldsFragment = gql`
  fragment ContributeCardTierFields on Tier {
    id
    name
    slug
    description
    useStandalonePage
    goal {
      value
      # valueInCents
      currency
    }
    interval
    # currency
    amount {
      value
      currency
    }
    minimumAmount {
      value
      currency
    }
    button
    amountType
    endsAt
    type
    maxQuantity
    stats {
      id
      # TODO
      # availableQuantity
      # totalDonated
      # totalRecurringDonations
      # contributors {
      #   id
      #   all
      #   users
      #   organizations
      # }
    }
    contributors(limit: $nbContributorsPerContributeCard) {
      nodes {
        id
        ...ContributeCardContributorFields
      }
    }
  }
  ${contributeCardContributorFieldsFragment}
`;

const contributeCardEventFieldsFragment = gql`
  fragment ContributeCardEventFields on Event {
    id
    slug
    name
    description
    # image
    imageUrl
    isActive
    startsAt
    endsAt
    backgroundImageUrl(height: 208)
    tiers {
      nodes {
        id
        type
      }
    }
    contributors(limit: $nbContributorsPerContributeCard, roles: [BACKER, ATTENDEE]) {
      nodes {
        id
        ...ContributeCardContributorFields
      }
    }
    # stats {
    #   id
    #   backers {
    #     id
    #     all
    #     users
    #     organizations
    #   }
    # }
  }
  ${contributeCardContributorFieldsFragment}
`;

const contributeCardProjectFieldsFragment = gql`
  fragment ContributeCardProjectFields on Project {
    id
    slug
    name
    description
    # image
    imageUrl
    isActive
    isArchived
    backgroundImageUrl(height: 208)
    contributors(limit: $nbContributorsPerContributeCard, roles: [BACKER]) {
      nodes {
        id
        ...ContributeCardContributorFields
      }
    }
    # stats {
    #   id
    #   backers {
    #     id
    #     all
    #     users
    #     organizations
    #   }
    # }
  }
  ${contributeCardContributorFieldsFragment}
`;

export const collectivePageQuery = gql`
  query CollectivePage($slug: String!, $nbContributorsPerContributeCard: Int) {
    account(slug: $slug, throwIfMissing: false) {
      id
      slug
      name
      description
      longDescription
      # backgroundImage
      backgroundImageUrl
      twitterHandle
      repositoryUrl
      website
      socialLinks {
        type
        url
      }
      tags

      type
      currency
      settings
      isActive

      isArchived
      isFrozen
      isHost
      isIncognito

      permissions {
        contact {
          allowed
        }
      }

      # image
      imageUrl(height: 256)

      # canContact
      supportedExpenseTypes
      features {
        id
        ...NavbarFields
      }
      # ordersFromCollective: orders(filter: OUTGOING, onlySubscriptions: true) {
      #   id
      #   isSubscriptionActive
      # }

      # memberOf(onlyActiveCollectives: true, limit: 1) {
      #   id
      # }

      stats {
        id
        balance {
          value
          currency
        }
        balanceWithBlockedFunds: balance(withBlockedFunds: true) {
          value
          currency
        }
        yearlyBudget {
          value
          currency
        }
        # updates
        activeRecurringContributions
        totalAmountReceived(periodInMonths: 12) {
          value
          currency
        }
        totalAmountRaised: totalAmountReceived {
          value
          currency
        }
        totalNetAmountRaised: totalAmountReceived(net: true) {
          value
          currency
        }
        # backers {
        #   id
        #   all
        #   users
        #   organizations
        # }
        # transactions {
        #   id
        #   all
        # }
      }

      connectedTo: memberOf(role: CONNECTED_ACCOUNT, limit: 1) {
        nodes {
          id
          account {
            id
            name
            type
            slug
          }
        }
      }

      coreContributors: members(role: [ADMIN, MEMBER]) {
        nodes {
          id
          # ...ContributorsFields
          ...MembersFields
        }
      }

      # events(includePastEvents: true, includeInactive: true) {

      events: childrenAccounts(accountType: EVENT) {
        nodes {
          id
          ...ContributeCardEventFields
        }
      }

      projects: childrenAccounts(accountType: PROJECT) {
        nodes {
          id
          ...ContributeCardProjectFields
        }
      }

      admins: members(role: ADMIN) {
        nodes {
          id
        }
      }

      connectedCollectives: members(role: CONNECTED_ACCOUNT) {
        nodes {
          id
          collective: account {
            id
            slug
            name
            type
            description
            backgroundImageUrl(height: 208)
            stats {
              id
              # backers {
              #   id
              #   all
              #   users
              #   organizations
              # }
            }
            # contributors(limit: $nbContributorsPerContributeCard) {
            #   id
            #   ...ContributeCardContributorFields
            # }
          }
        }
      }

      ... on AccountWithContributions {
        tiers {
          nodes {
            id
            ...ContributeCardTierFields
          }
        }

        financialContributors: contributors(roles: [BACKER], limit: 150) {
          nodes {
            id
            ...ContributorsFields
          }
        }
      }

      ... on AccountWithParent {
        parent {
          id
          name
          slug
          # image
          imageUrl
          backgroundImageUrl
          twitterHandle
          type
          # coreContributors: contributors(roles: [ADMIN, MEMBER]) {
          #   id
          #   ...ContributorsFields
          # }
        }
      }

      ... on AccountWithHost {
        isApproved
        hostFeePercent
        platformFeePercent
        host {
          id
          name
          slug
          type
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
      }

      ... on Individual {
        isGuest
        # company
      }

      ... on Host {
        plan {
          id
          hostedCollectives
        }
        canApply: isOpenToApplications
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
        # privateInstructions
        # orders {
        #   nodes {
        #     id
        #     createdAt
        #     quantity
        #     publicMessage
        #     fromCollective {
        #       id
        #       type
        #       name
        #       company
        #       image
        #       isIncognito
        #       imageUrl
        #       slug
        #       twitterHandle
        #       description
        #       ... on User {
        #         email
        #       }
        #     }
        #     tier {
        #       id
        #       name
        #       type
        #     }
        #   }
        # }
      }
    }
  }

  ${contributorsFieldsFragment}
  ${membersFieldsFragment}
  ${collectiveNavbarFieldsFragment}
  ${contributeCardTierFieldsFragment}
  ${contributeCardEventFieldsFragment}
  ${contributeCardProjectFieldsFragment}
`;

export const convertCollectivePageToGraphqlV1 = account => {
  const collective = { ...account };

  collective.parentCollective = collective.parent;

  // GraphQL V2 nodes
  collective.coreContributors = collective.coreContributors?.nodes || [];
  collective.financialContributors = collective.financialContributors?.nodes || [];
  collective.tiers = collective.tiers?.nodes || [];
  collective.events = collective.events?.nodes || [];
  collective.projects = collective.projects?.nodes || [];
  collective.connectedTo = collective.connectedTo?.nodes || [];
  collective.admins = collective.admins?.nodes || [];
  collective.connectedCollectives = collective.connectedCollectives?.nodes || [];

  // Old stats
  collective.stats = { backers: { all: 0, users: 0, organizations: 0 } };

  collective.canContact = collective.permissions?.contact?.allowed || false;

  return collective;
};
