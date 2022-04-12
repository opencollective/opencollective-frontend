import { gqlV2 } from '../../../lib/graphql/helpers';

import { collectiveNavbarFieldsFragment } from '../../collective-page/graphql/fragments';

export const loggedInAccountExpensePayoutFieldsFragment = gqlV2/* GraphQL */ `
  fragment LoggedInAccountExpensePayoutFields on Individual {
    id
    slug
    imageUrl
    type
    name
    legalName
    location {
      id
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
            id
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
    features {
      id
      MULTI_CURRENCY_EXPENSES
      PAYPAL_PAYOUTS
    }
    paypalPreApproval {
      id
      balance {
        currency
        valueInCents
      }
    }
    location {
      id
      address
      country
    }
    transferwise {
      id
      availableCurrencies
    }
    supportedPayoutMethods
    isTrustedHost
    plan {
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
    amountInAccountCurrency: amountV2(currencySource: ACCOUNT) {
      valueInCents
      currency
      exchangeRate {
        date
        value
        source
        isApproximate
      }
    }
    createdAt
    invoiceInfo
    requiredLegalDocuments
    feesPayer
    draft
    items {
      id
      incurredAt
      description
      amount
      url
    }
    taxes {
      id
      type
      rate
      idNumber
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
      id
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
        id
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
      features {
        ...NavbarFields
        MULTI_CURRENCY_EXPENSES
      }
      expensesTags {
        id
        tag
      }
      location {
        id
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
          transferwise {
            id
            availableCurrencies
          }
        }
      }

      # For Hosts with Budget capabilities

      ... on Organization {
        isHost
        isActive
        host {
          ...ExpenseHostFields
          transferwise {
            id
            availableCurrencies
          }
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
      approve {
        allowed
        reason
      }
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
    recurringExpense {
      interval
      endsAt
    }
  }

  ${expenseHostFields}
  ${collectiveNavbarFieldsFragment}
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
    amountInAccountCurrency: amountV2(currencySource: ACCOUNT) {
      valueInCents
      currency
      exchangeRate {
        date
        value
        source
        isApproximate
      }
    }
    currency
    type
    requiredLegalDocuments
    feesPayer
    account {
      id
      name
      slug
      createdAt
      currency
      type
      stats {
        id
        balanceWithBlockedFunds {
          valueInCents
          currency
        }
      }
      ... on AccountWithParent {
        parent {
          id
          slug
        }
      }
    }
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
      approve {
        allowed
        reason
      }
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
    taxes {
      id
      type
      rate
    }
    attachedFiles {
      id
      url
    }
  }
`;
