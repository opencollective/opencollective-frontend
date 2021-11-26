import { gqlV2 } from '../../../lib/graphql/helpers';

export const loggedInAccountExpensePayoutFieldsFragment = gqlV2/* GraphQL */ `
  fragment LoggedInAccountExpensePayoutFields on Individual {
    id
    slug
    imageUrl
    type
    name
    legalName
    location {
      address
      country
      structured
    }
    payoutMethods {
      id
      type
      name
      data
      isSaved
    }
    adminMemberships: memberOf(role: ADMIN, includeIncognito: false, accountType: [ORGANIZATION, COLLECTIVE, FUND]) {
      nodes {
        id
        account {
          id
          slug
          imageUrl
          type
          name
          legalName
          isActive
          isHost
          ... on AccountWithHost {
            host {
              id
              payoutMethods {
                id
                type
                name
                data
                isSaved
              }
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
            structured
          }
          payoutMethods {
            id
            type
            name
            data
            isSaved
          }
          childrenAccounts {
            nodes {
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
            }
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
    legalName
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
      id
    }
    transferwise {
      id
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
    draft
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
      legalName
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

      # For Collectives, Funds, Events and Projects
      ... on AccountWithHost {
        isApproved
        host {
          id
        }
      }

      # For Fiscal Hosts
      ... on Organization {
        host {
          id
        }
      }
    }
    payeeLocation {
      address
      country
      structured
    }
    createdByAccount {
      id
      slug
      name
      type
      imageUrl
    }
    host {
      id
      name
      legalName
      slug
      type
      website
      location {
        address
        country
      }
    }
    requestedByAccount {
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

      stats {
        id
        balanceWithBlockedFunds {
          valueInCents
          currency
        }
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
    virtualCard {
      id
      name
      last4
    }
    permissions {
      id
      canEdit
      canEditTags
      canDelete
      canSeeInvoiceInfo
      canApprove
      canUnapprove
      canReject
      canMarkAsSpam
      canPay
      canMarkAsUnpaid
      canComment
      canUnschedulePayment
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
      id
      canDelete
      canApprove
      canUnapprove
      canReject
      canMarkAsSpam
      canPay
      canMarkAsUnpaid
      canSeeInvoiceInfo
      canEditTags
      canUnschedulePayment
    }
    payoutMethod {
      id
      type
      data
      isSaved
    }
    payee {
      id
      type
      slug
      name
      imageUrl(height: 80)
      isAdmin

      # For Collectives, Funds, Events and Projects
      ... on AccountWithHost {
        isApproved
        host {
          id
        }
      }

      # For Fiscal Hosts
      ... on Organization {
        host {
          id
        }
      }
    }
    createdByAccount {
      id
      type
      slug
      name
    }
  }
`;

export const expensesListAdminFieldsFragment = gqlV2/* GraphQL */ `
  fragment ExpensesListAdminFieldsFragment on Expense {
    id
    payoutMethod {
      id
      type
      data
    }
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
