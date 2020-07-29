import { gqlV2 } from '../../../lib/graphql/helpers';

import { commentFieldsFragment } from '../../conversations/graphql';

export const loggedInAccountExpensePayoutFieldsFragment = gqlV2/* GraphQL */ `
  fragment LoggedInAccountExpensePayoutFieldsFragment on Individual {
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
    adminMemberships: memberOf(role: ADMIN, includeIncognito: false, accountType: [ORGANIZATION, INDIVIDUAL]) {
      nodes {
        id
        account {
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
        }
      }
    }
  }
`;

const hostFieldsFragment = gqlV2/* GraphQL */ `
  fragment HostFieldsFragment on Host {
    id
    name
    slug
    type
    expensePolicy
    website
    settings
    connectedAccounts {
      id
      service
    }
    location {
      address
      country
    }
    plan {
      transferwisePayouts
      transferwisePayoutsLimit
    }
    transferwise {
      availableCurrencies
    }
  }
`;

export const expensePageExpenseFieldsFragment = gqlV2/* GraphQL */ `
  fragment ExpensePageExpenseFieldsFragment on Expense {
    id
    legacyId
    description
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
      ... on Organization {
        id
        isHost
        balance
        host {
          ...HostFieldsFragment
        }
      }

      ... on Collective {
        id
        isApproved
        balance
        host {
          ...HostFieldsFragment
        }
      }
      ... on Fund {
        id
        isApproved
        balance
        host {
          ...HostFieldsFragment
        }
      }
      ... on Event {
        id
        isApproved
        balance
        host {
          ...HostFieldsFragment
        }
        parent {
          id
          slug
          name
          type
          imageUrl
        }
      }
      ... on Project {
        id
        isApproved
        balance
        host {
          ...HostFieldsFragment
        }
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
  ${hostFieldsFragment}
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
