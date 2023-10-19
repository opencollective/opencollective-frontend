import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';

import { collectiveNavbarFieldsFragment } from '../../components/collective-page/graphql/fragments';

import { API_V2_CONTEXT, gqlV1 } from './helpers';

export const transactionFieldsFragment = gqlV1/* GraphQL */ `
  fragment TransactionFields on Transaction {
    id
    uuid
    description
    createdAt
    type
    amount
    currency
    hostCurrency
    hostCurrencyFxRate
    netAmountInCollectiveCurrency(fetchHostFee: true)
    hostFeeInHostCurrency(fetchHostFee: true)
    platformFeeInHostCurrency
    taxAmount
    paymentProcessorFeeInHostCurrency
    paymentMethod {
      id
      service
      type
      name
      data
    }
    collective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
    }
    fromCollective {
      id
      name
      slug
      path
      type
      imageUrl
      isIncognito
    }
    usingGiftCardFromCollective {
      id
      slug
      name
      type
    }
    host {
      id
      slug
      name
      currency
      hostFeePercent
      type
    }
    ... on Expense {
      expense {
        id
        tags
      }
    }
    ... on Order {
      createdAt
      subscription {
        id
        interval
      }
    }
  }
`;

export const transactionsQuery = gqlV1/* GraphQL */ `
  query Transactions(
    $CollectiveId: Int!
    $type: String
    $limit: Int
    $offset: Int
    $dateFrom: String
    $dateTo: String
    $kinds: [String]
  ) {
    allTransactions(
      CollectiveId: $CollectiveId
      type: $type
      limit: $limit
      offset: $offset
      dateFrom: $dateFrom
      dateTo: $dateTo
      kinds: $kinds
    ) {
      id
      ...TransactionFields
      refundTransaction {
        id
        ...TransactionFields
      }
    }
  }

  ${transactionFieldsFragment}
`;

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
    isActive
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
      isPledged
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

export const collectiveNavbarQuery = gql`
  query CollectiveNavbar($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      type
      slug
      name
      imageUrl(height: 256)
      ... on Event {
        parent {
          id
          slug
        }
      }
      ... on Project {
        parent {
          id
          slug
        }
      }
      features {
        id
        ...NavbarFields
      }
    }
  }
  ${collectiveNavbarFieldsFragment}
`;

export const addCollectiveNavbarData = component => {
  return graphql(collectiveNavbarQuery, { options: { context: API_V2_CONTEXT } })(component);
};
