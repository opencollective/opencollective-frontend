import { gqlV2 } from '../../../lib/graphql/helpers';

import { commentFieldsFragment } from '../../conversations/graphql';

export const loggedInAccountExpensePayoutFieldsFragment = gqlV2/* GraphQL */ `
  fragment LoggedInAccountExpensePayoutFields on Individual {
    id
    slug
    imageUrl
    type
    name
    location {
      address
      country
    }
    payoutMethods {
      id
      type
      name
      data
      isSaved
    }
    adminMemberships: memberOf(
      role: ADMIN
      includeIncognito: false
      accountType: [ORGANIZATION, COLLECTIVE, EVENT, FUND, PROJECT, INDIVIDUAL]
    ) {
      nodes {
        id
        account {
          id
          slug
          imageUrl
          type
          name
          isActive
          ... on AccountWithHost {
            host {
              id
            }
          }
          ... on Organization {
            host {
              id
            }
          }
          location {
            address
            country
          }
          payoutMethods {
            id
            type
            name
            data
            isSaved
          }
        }
      }
    }
  }
`;

export const expenseHostFields = gqlV2/* GraphQL */ `
  fragment ExpenseHostFields on Host {
    id
    name
    slug
    type
    currency
    isHost
    expensePolicy
    website
    settings
    paypalPreApproval {
      id
      balance {
        currency
        valueInCents
      }
    }
    location {
      address
      country
    }
    supportedPayoutMethods
    plan {
      transferwisePayouts
      transferwisePayoutsLimit
    }
  }
`;

export const expensePageExpenseFieldsFragment = gqlV2/* GraphQL */ `
  fragment ExpensePageExpenseFields on Expense {
    id
    legacyId
    description
    longDescription
    currency
    type
    status
    privateMessage
    tags
    amount
    createdAt
    invoiceInfo
    requiredLegalDocuments
    items {
      id
      incurredAt
      description
      amount
      url
    }
    attachedFiles {
      id
      url
    }
    payee {
      id
      slug
      name
      type
      isAdmin
      location {
        address
        country
      }
      payoutMethods {
        id
        type
        name
        data
        isSaved
      }
      ... on AccountWithHost {
        host {
          id
        }
      }
    }
    payeeLocation {
      address
      country
    }
    createdByAccount {
      id
      slug
      name
      type
      imageUrl
    }
    account {
      id
      slug
      name
      type
      imageUrl
      description
      settings
      twitterHandle
      currency
      expensePolicy
      expensesTags {
        id
        tag
      }
      location {
        address
        country
      }

      ... on AccountWithContributions {
        balance
      }

      ... on AccountWithHost {
        isApproved
        host {
          ...ExpenseHostFields
        }
      }

      # For Hosts with Budget capabilities

      ... on Organization {
        isHost
        isActive
        balance
        host {
          ...ExpenseHostFields
        }
      }

      ... on Event {
        parent {
          id
          slug
          name
          type
          imageUrl
        }
      }
      ... on Project {
        parent {
          id
          slug
          name
          type
          imageUrl
        }
      }
    }
    payoutMethod {
      id
      type
      data
      isSaved
    }
    comments(limit: 300) {
      nodes {
        ...CommentFields
      }
    }
    permissions {
      canEdit
      canDelete
      canSeeInvoiceInfo
      canApprove
      canUnapprove
      canReject
      canPay
      canMarkAsUnpaid
      canComment
    }
    activities {
      id
      type
      createdAt
      data
      individual {
        id
        type
        slug
        name
        imageUrl
      }
    }
  }

  ${commentFieldsFragment}
  ${expenseHostFields}
`;

export const expensesListFieldsFragment = gqlV2/* GraphQL */ `
  fragment ExpensesListFieldsFragment on Expense {
    id
    legacyId
    description
    status
    createdAt
    tags
    amount
    currency
    type
    requiredLegalDocuments
    permissions {
      canDelete
      canApprove
      canUnapprove
      canReject
      canPay
      canMarkAsUnpaid
    }
    payoutMethod {
      id
      type
    }
    payee {
      id
      type
      slug
      name
      imageUrl(height: 80)
      isAdmin
    }
    createdByAccount {
      id
      type
      slug
    }
  }
`;

export const expensesListAdminFieldsFragment = gqlV2/* GraphQL */ `
  fragment ExpensesListAdminFieldsFragment on Expense {
    id
    items {
      id
      description
      incurredAt
      url
      amount
    }
    attachedFiles {
      id
      url
    }
  }
`;
