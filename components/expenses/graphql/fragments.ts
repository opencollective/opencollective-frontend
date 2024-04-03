import { gql } from '../../../lib/graphql/helpers';

import { accountHoverCardFields } from '../../AccountHoverCard';
import { accountNavbarFieldsFragment } from '../../collective-navbar/fragments';

export const loggedInAccountExpensePayoutFieldsFragment = gql`
  fragment LoggedInAccountExpensePayoutFields on Individual {
    id
    slug
    imageUrl
    type
    name
    legalName
    hasTwoFactorAuth
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
          policies {
            id
            REQUIRE_2FA_FOR_ADMINS
          }
          ... on AccountWithParent {
            parent {
              id
              policies {
                id
                REQUIRE_2FA_FOR_ADMINS
              }
            }
          }
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
              payoutMethods {
                id
                type
                name
                data
                isSaved
              }
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

export const accountingCategoryFields = gql`
  fragment AccountingCategoryFields on AccountingCategory {
    id
    name
    kind
    instructions
    friendlyName
    code
    expensesTypes
  }
`;

export const expenseHostFields = gql`
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
    expenseAccountingCategories: accountingCategories(kind: EXPENSE) {
      nodes {
        id
        ...AccountingCategoryFields
      }
    }
    policies {
      id
      EXPENSE_CATEGORIZATION {
        requiredForExpenseSubmitters
        requiredForCollectiveAdmins
      }
    }
  }
  ${accountingCategoryFields}
`;

export const expenseValuesByRoleFragment = gql`
  fragment ExpenseValuesByRoleFragment on ExpenseValuesByRole {
    id
    submitter {
      accountingCategory {
        ...AccountingCategoryFields
      }
    }
    accountAdmin {
      accountingCategory {
        ...AccountingCategoryFields
      }
    }
    hostAdmin {
      accountingCategory {
        ...AccountingCategoryFields
      }
    }
  }
  ${accountingCategoryFields}
`;

export const expensePageExpenseFieldsFragment = gql`
  fragment ExpensePageExpenseFields on Expense {
    id
    legacyId
    description
    longDescription
    currency
    type
    status
    onHold
    privateMessage
    tags
    amount
    accountingCategory {
      id
      ...AccountingCategoryFields
    }
    valuesByRole {
      id
      ...ExpenseValuesByRoleFragment
    }
    amountInAccountCurrency: amountV2(currencySource: ACCOUNT) {
      valueInCents
      currency
      exchangeRate {
        date
        value
        source
        isApproximate
        fromCurrency
        toCurrency
      }
    }
    createdAt
    invoiceInfo
    merchantId
    requiredLegalDocuments
    feesPayer
    draft
    items {
      id
      incurredAt
      description
      amount
      amountV2 {
        valueInCents
        currency
        exchangeRate {
          date
          value
          source
          fromCurrency
          toCurrency
        }
      }
      referenceExchangeRate {
        value
        fromCurrency
        toCurrency
      }
      url
      file {
        id
        ... on ImageFileInfo {
          width
        }
      }
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
      name
      info {
        id
        name
        size
        ... on ImageFileInfo {
          width
        }
      }
    }
    payee {
      id
      slug
      name
      legalName
      imageUrl
      hasImage
      type
      isAdmin
      isActive
      description
      ...AccountHoverCardFields
      location {
        id
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
          slug
          # For Expenses across hosts
          payoutMethods {
            id
            type
            name
            data
            isSaved
          }
        }
      }

      # For Fiscal Hosts
      ... on Organization {
        host {
          id
          slug
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
      ...AccountHoverCardFields
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
      ...AccountHoverCardFields
    }
    approvedBy {
      id
      type
      slug
      name
      imageUrl
      ...AccountHoverCardFields
    }
    account {
      id
      legacyId
      slug
      name
      type
      imageUrl
      hasImage
      backgroundImageUrl
      isActive
      description
      settings
      twitterHandle
      currency
      expensePolicy
      supportedExpenseTypes
      features {
        id
        ...NavbarFields
        MULTI_CURRENCY_EXPENSES
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

      ... on AccountWithParent {
        parent {
          id
          slug
          imageUrl
          backgroundImageUrl
          twitterHandle
        }
      }

      ... on AccountWithHost {
        isApproved
        hostAgreements {
          totalCount
        }
        host {
          id
          slug
          legacyId
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
          id
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
      ...AccountHoverCardFields
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
      canEditAccountingCategory
      canDelete
      canSeeInvoiceInfo
      canApprove
      canUnapprove
      canReject
      canMarkAsSpam
      canPay
      canMarkAsUnpaid
      canMarkAsIncomplete
      canComment
      canUnschedulePayment
      canVerifyDraftExpense
      canUsePrivateNote
      canHold
      canRelease
      approve {
        allowed
        reason
        reasonDetails
      }
    }
    activities {
      id
      type
      createdAt
      data
      account {
        id
        slug
        ... on AccountWithHost {
          host {
            id
            slug
          }
        }
      }
      individual {
        id
        type
        slug
        name
        imageUrl
        ...AccountHoverCardFields
      }
      transaction {
        id
        kind
        type
        amount {
          valueInCents
          currency
        }
        platformFee {
          valueInCents
          currency
        }
        hostFee {
          valueInCents
          currency
        }
        paymentProcessorFee {
          valueInCents
          currency
        }
        netAmount {
          valueInCents
          currency
        }
        taxAmount {
          valueInCents
          currency
        }
        taxInfo {
          id
          rate
          type
          percentage
        }
        fromAccount {
          id
          slug
          name
          ... on AccountWithHost {
            hostFeePercent
          }
        }
        toAccount {
          id
          slug
          name
          ... on AccountWithHost {
            hostFeePercent
          }
        }
        expense {
          id
          currency
          amount
          feesPayer
        }
        relatedTransactions(kind: PAYMENT_PROCESSOR_FEE) {
          id
          type
          kind
          amount {
            valueInCents
            currency
          }
        }
      }
    }
    recurringExpense {
      id
      interval
      endsAt
    }
    securityChecks {
      level
      message
      scope
      details
    }
  }

  ${expenseHostFields}
  ${accountNavbarFieldsFragment}
  ${accountingCategoryFields}
  ${accountHoverCardFields}
  ${expenseValuesByRoleFragment}
`;

export const expensesListFieldsFragment = gql`
  fragment ExpensesListFieldsFragment on Expense {
    id
    legacyId
    description
    status
    createdAt
    tags
    amount
    comments {
      totalCount
    }
    accountingCategory {
      id
      ...AccountingCategoryFields
    }
    valuesByRole {
      id
      ...ExpenseValuesByRoleFragment
    }
    amountInAccountCurrency: amountV2(currencySource: ACCOUNT) {
      valueInCents
      currency
      exchangeRate {
        date
        value
        source
        isApproximate
        fromCurrency
        toCurrency
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
      imageUrl
      stats {
        id
        balanceWithBlockedFunds {
          valueInCents
          currency
        }
      }
      ... on AccountWithHost {
        host {
          id
          slug
        }
      }
      ... on AccountWithParent {
        parent {
          id
          slug
        }
      }
      ...AccountHoverCardFields
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
      canMarkAsIncomplete
      canSeeInvoiceInfo
      canEditTags
      canEditAccountingCategory
      canUnschedulePayment
      canHold
      canRelease
      approve {
        allowed
        reason
        reasonDetails
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
      imageUrl
      hasImage
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
      ...AccountHoverCardFields
    }
    createdByAccount {
      id
      type
      slug
      name
      ...AccountHoverCardFields
    }
  }
  ${accountingCategoryFields}
  ${expenseValuesByRoleFragment}
  ${accountHoverCardFields}
`;

export const expensesListAdminFieldsFragment = gql`
  fragment ExpensesListAdminFieldsFragment on Expense {
    id
    onHold
    account {
      id
      ... on AccountWithHost {
        hostAgreements {
          totalCount
        }
      }
    }
    createdByAccount {
      id
      ... on Individual {
        emails
      }
    }
    payee {
      id
      ... on Individual {
        emails
      }
    }
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
      file {
        id
        ... on ImageFileInfo {
          width
        }
      }
    }
    taxes {
      id
      type
      rate
    }
    attachedFiles {
      id
      url
      name
      info {
        id
        ... on ImageFileInfo {
          width
        }
      }
    }
    securityChecks {
      level
      message
      scope
      details
    }
  }
`;
