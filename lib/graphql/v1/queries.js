import { collectiveNavbarFieldsFragment } from '../../../components/collective-page/graphql/fragments';

import { gqlV1 } from '../helpers';

export const loggedInUserQuery = gqlV1/* GraphQL */ `
  query LoggedInUser {
    LoggedInUser {
      id
      email
      image
      isLimited
      CollectiveId
      hasSeenLatestChangelogEntry
      hasTwoFactorAuth
      hasPassword
      isRoot
      collective {
        id
        name
        legalName
        type
        slug
        imageUrl
        settings
        currency
        categories
        location {
          id
          address
          country
          structured
        }
      }
      memberOf {
        id
        role
        collective {
          id
          slug
          type
          isIncognito
          name
          currency
          isHost
          endsAt
          imageUrl
          categories
          isArchived
          policies {
            id
            REQUIRE_2FA_FOR_ADMINS
          }
          parentCollective {
            id
            policies {
              id
              REQUIRE_2FA_FOR_ADMINS
            }
          }
          host {
            id
          }
          settings
          location {
            id
            address
            country
            structured
          }
          children {
            id
            slug
            type
            name
            isActive
            isArchived
            imageUrl
            host {
              id
            }
          }
        }
      }
    }
  }
`;

export const editCollectivePageFieldsFragment = gqlV1/* GraphQL */ `
  fragment EditCollectivePageFields on CollectiveInterface {
    id
    type
    slug
    isActive
    isIncognito
    startsAt
    endsAt
    timezone
    host {
      id
      createdAt
      slug
      name
      legalName
      currency
      settings
      description
      website
      twitterHandle
      imageUrl
      backgroundImage
      hostCollective {
        id
        slug
        name
        currency
      }
      location {
        id
        country
      }
      stats {
        id
        collectives {
          id
          hosted
        }
      }
    }
    name
    legalName
    company
    image # We still query 'image' because it's required for the edition
    imageUrl
    backgroundImage
    description
    longDescription
    location {
      id
      name
      address
      country
      structured
      lat
      long
    }
    privateInstructions
    tags
    twitterHandle
    repositoryUrl
    website
    socialLinks {
      type
      url
    }
    currency
    settings
    createdAt
    isArchived
    isApproved
    isDeletable
    isHost
    hostFeePercent
    expensePolicy
    contributionPolicy
    stats {
      id
      yearlyBudget
      balance
      backers {
        id
        all
      }
      totalAmountSpent
    }
    tiers {
      id
      slug
      type
      name
      description
      useStandalonePage
      longDescription
      amount
      presets
      amountType
      minimumAmount
      goal
      interval
      currency
      maxQuantity
      button
      stats {
        id
        availableQuantity
      }
      data
    }
    members(roles: ["ADMIN", "MEMBER", "HOST"]) {
      id
      createdAt
      since
      role
      description
      stats {
        id
        totalDonations
      }
      tier {
        id
        name
      }
      member {
        id
        name
        imageUrl
        slug
        twitterHandle
        description
        ... on User {
          email
        }
      }
    }
    paymentMethods(type: ["CREDITCARD", "GIFTCARD", "PREPAID"], hasBalanceAboveZero: true) {
      id
      uuid
      name
      data
      monthlyLimitPerMember
      service
      type
      balance
      currency
      expiryDate
      orders(hasActiveSubscription: true) {
        id
      }
    }
    # limit: 1 as current best practice to avoid the API fetching entries it doesn't need
    createdGiftCards(limit: 1) {
      total
    }
    connectedAccounts {
      id
      service
      username
      createdAt
      settings
      updatedAt
    }
    plan {
      id
      hostDashboard
      hostedCollectives
      hostFees
      hostFeeSharePercent
      manualPayments
      name
    }
    parentCollective {
      id
      slug
      name
      currency
      imageUrl
      backgroundImage
      settings
    }
    features {
      id
      ...NavbarFields
      VIRTUAL_CARDS
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

// This query is referenced by its name in `components/edit-collective/EditConnectedAccount.js`, so be careful when renaming it
export const editCollectivePageQuery = gqlV1/* GraphQL */ `
  query EditCollectivePage($slug: String) {
    Collective(slug: $slug) {
      id
      ...EditCollectivePageFields
    }
  }

  ${editCollectivePageFieldsFragment}
`;

export const legacyCollectiveQuery = gqlV1/* GraphQL */ `
  query LegacyCollective($slug: String) {
    Collective(slug: $slug) {
      id
      isActive
      type
      slug
      path
      name
      company
      imageUrl
      backgroundImage
      description
      longDescription
      location {
        id
        name
        address
        country
        lat
        long
      }
      twitterHandle
      githubHandle
      repositoryUrl
      website
      currency
      settings
      createdAt
      isHost
      hostFeePercent
      canApply
      isArchived
      isFrozen
      isApproved
      host {
        id
        slug
        name
        imageUrl
        features {
          id
          CONTACT_FORM
        }
      }
      ... on User {
        isIncognito
      }
    }
  }
`;

export const changelogTriggerLoggedInUserQuery = gqlV1/* GraphQL */ `
  query ChangelogTriggerLoggedInUser {
    LoggedInUser {
      id
      hasSeenLatestChangelogEntry
    }
  }
`;

export const collectiveSettingsQuery = gqlV1/* GraphQL */ `
  query EditCollectivePage($slug: String) {
    Collective(slug: $slug) {
      id
      settings
    }
  }
`;

export const expenseFormPayeeStepCollectivePickerSearchQuery = gqlV1/* GraphQL */ `
  query ExpenseFormPayeeStepCollectivePickerSearch(
    $term: String!
    $types: [TypeOfCollective]
    $limit: Int
    $hostCollectiveIds: [Int]
    $parentCollectiveIds: [Int]
    $skipGuests: Boolean
    $includeArchived: Boolean
    $includeVendorsForHostId: Int
  ) {
    search(
      term: $term
      types: $types
      limit: $limit
      hostCollectiveIds: $hostCollectiveIds
      parentCollectiveIds: $parentCollectiveIds
      skipGuests: $skipGuests
      includeArchived: $includeArchived
      includeVendorsForHostId: $includeVendorsForHostId
    ) {
      id
      collectives {
        id
        type
        slug
        name
        currency
        location {
          id
          address
          country
        }
        imageUrl(height: 64)
        hostFeePercent
        isActive
        isArchived
        isHost
        payoutMethods {
          legacyId: id
          type
          name
          data
          isSaved
        }
        ... on User {
          isTwoFactorAuthEnabled
        }
        ... on Organization {
          isTrustedHost
        }
        ... on Vendor {
          hasPayoutMethod
        }
      }
    }
  }
`;

export const unhostAccountCollectivePickerSearchQuery = gqlV1/* GraphQL */ `
  query UnhostAccountCollectivePickerSearch(
    $term: String!
    $types: [TypeOfCollective]
    $limit: Int
    $hostCollectiveIds: [Int]
  ) {
    search(term: $term, types: $types, limit: $limit, hostCollectiveIds: $hostCollectiveIds) {
      id
      collectives {
        id
        type
        slug
        name
        imageUrl(height: 64)
        isActive
        host {
          id
          slug
          name
        }
      }
    }
  }
`;

export const collectiveBannerIframeQuery = gqlV1/* GraphQL */ `
  query CollectiveBannerIframe($collectiveSlug: String) {
    Collective(slug: $collectiveSlug) {
      id
      name
      slug
      currency
      stats {
        id
        backers {
          id
          users
          organizations
          collectives
        }
      }
    }
  }
`;
