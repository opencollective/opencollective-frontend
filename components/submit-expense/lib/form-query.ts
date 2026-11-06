/**
 * The Expense form query: the only data fetch for the form options.
 */
import { gql } from '@apollo/client';

import type { ExpenseFormSchemaQueryVariables } from '../../../lib/graphql/types/v2/graphql';
import type LoggedInUser from '../../../lib/LoggedInUser';
import {
  PAYEE_SLUG_CREATE_LEGAL_ENTITY,
  PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER,
  PAYEE_SLUG_INVITE,
  PAYEE_SLUG_INVITE_EXISTING_USER,
  PAYEE_SLUG_INVITE_SOMEONE,
  PAYEE_SLUG_NEW_VENDOR,
  PAYEE_SLUG_VENDOR,
} from '../../expenses/lib/constants';

import { accountHoverCardFieldsFragment } from '../../AccountHoverCard';
import { accountingCategorySelectFieldsFragment } from '../../AccountingCategorySelect';
import { loggedInAccountExpensePayoutFieldsFragment } from '../../expenses/graphql/fragments';

import type { ExpenseFormStartOptions, ExpenseFormValues } from './types';

export const expenseFormSchemaQuery = gql`
  query ExpenseFormSchema(
    $collectiveSlug: String
    $hasCollectiveSlug: Boolean!
    $payeeSlug: String
    $hasPayeeSlug: Boolean!
    $submitterSlug: String
    $hasSubmitterSlug: Boolean!
    $hasExpenseId: Boolean!
    $expenseId: Int
    $expenseKey: String
  ) {
    account(slug: $collectiveSlug) @include(if: $hasCollectiveSlug) {
      ...ExpenseFormAccountFields

      ... on AccountWithHost {
        host {
          vendorsForAccount: vendors(canBeUsedWithAccounts: [{ slug: $collectiveSlug }], limit: 5) {
            nodes {
              ...ExpenseVendorFields
            }
          }
          vendors(canBeUsedWithAccounts: [{ slug: $collectiveSlug }], limit: 1) {
            totalCount
          }
        }
      }

      ... on Organization {
        host {
          vendorsForAccount: vendors(canBeUsedWithAccounts: [{ slug: $collectiveSlug }], limit: 5) {
            nodes {
              ...ExpenseVendorFields
            }
          }
          vendors(canBeUsedWithAccounts: [{ slug: $collectiveSlug }], limit: 1) {
            totalCount
          }
        }
      }
    }

    payee: account(slug: $payeeSlug) @include(if: $hasPayeeSlug) {
      ...ExpenseFormPayeeFields

      ... on Vendor {
        hasPayoutMethod
      }
    }

    loggedInAccount {
      id
      legacyId
      ...LoggedInAccountExpensePayoutFields
    }

    submitter: account(slug: $submitterSlug) @include(if: $hasSubmitterSlug) {
      ...ExpenseFormSubmitterFields
    }

    recentlySubmittedExpenses: expenses(
      createdByAccount: { slug: $submitterSlug }
      limit: 10
      types: [INVOICE, RECEIPT]
      orderBy: { field: CREATED_AT, direction: DESC }
    ) @include(if: $hasSubmitterSlug) {
      nodes {
        account {
          ...ExpenseFormAccountFields
        }
        payee {
          ...ExpenseFormAccountFields
        }
        payoutMethod {
          id
        }
      }
    }

    expense(expense: { legacyId: $expenseId }, draftKey: $expenseKey) @include(if: $hasExpenseId) {
      id
      legacyId
      description
      createdAt
      longDescription
      amountV2 {
        valueInCents
        currency
      }
      taxes {
        id
        type
        rate
        idNumber
      }
      requiredLegalDocuments
      accountingCategory {
        id
      }
      currency
      type
      status
      account {
        ...ExpenseFormAccountFields
      }
      createdByAccount {
        ...ExpenseFormAccountFields
      }
      payee {
        ...ExpenseFormPayeeFields
      }
      payoutMethod {
        id
        data
      }
      attachedFiles {
        id
        url
        info {
          name
          type
          size
        }
      }
      invoiceFile {
        id
        url
        name
        type
        size
        ... on ImageFileInfo {
          width
        }
      }
      items {
        id
        description
        url
        file {
          name
          type
          size
        }
        amount: amountV2 {
          currency
          valueInCents
          exchangeRate {
            value
            source
            fromCurrency
            toCurrency
            date
          }
        }
        createdAt
        incurredAt
      }
      privateMessage
      invoiceInfo
      reference
      tags
      permissions {
        id
        canEdit
        canEditAccountingCategory
        canEditTags
        canDeclineExpenseInvite(draftKey: $expenseKey)
      }
      draft
      lockedFields
      submitter: createdByAccount {
        ...ExpenseFormSubmitterFields
      }
    }
  }

  ${loggedInAccountExpensePayoutFieldsFragment}

  fragment ExpenseFormSchemaFeatureFields on Account {
    features {
      id
      MULTI_CURRENCY_EXPENSES
      PAYPAL_PAYOUTS
      CHART_OF_ACCOUNTS
      PAYPAL_CONNECT
      TAX_FORMS
    }
  }

  fragment ExpenseFormSchemaPolicyFields on Account {
    policies {
      id
      COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS
      EXPENSE_CATEGORIZATION {
        requiredForExpenseSubmitters
        requiredForCollectiveAdmins
      }
      EXPENSE_POLICIES {
        invoicePolicy
        receiptPolicy
        titlePolicy
        grantPolicy
      }
      USE_VENDOR_POLICY
    }
  }

  fragment ExpenseFormPayoutMethods on PayoutMethod {
    id
    type
    name
    data
    isSaved
    canBeEdited
    canBeDeleted
    createdAt
    updatedAt
    isVerified
  }

  fragment ExpenseFormSchemaHostFields on Host {
    id
    legacyId
    publicId
    name
    legalName
    slug
    type
    currency
    settings
    isFirstPartyHost
    isTrustedHost

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

    expensesTags {
      id
      tag
    }

    payoutMethods {
      ...ExpenseFormPayoutMethods
    }

    ...ExpenseFormSchemaPolicyFields
    ...ExpenseFormSchemaFeatureFields

    accountingCategories(kind: EXPENSE) {
      nodes {
        ...AccountingCategorySelectFields
      }
    }
  }

  fragment ExpenseVendorFields on Vendor {
    id
    slug
    name
    type
    hasPublicProfile
    description
    imageUrl(height: 64)
    hasPayoutMethod
    vendorInfo {
      taxId
      taxType
    }
    payoutMethods {
      ...ExpenseFormPayoutMethods
    }
    canBeUsedWithAccounts {
      id
      legacyId
      slug
      name
    }
  }

  fragment ExpenseFormAccountFields on Account {
    id
    publicId
    legacyId
    name
    slug
    type
    currency
    settings
    supportedExpenseTypes
    isVerified

    stats {
      balance {
        valueInCents
        currency
      }
    }

    ...AccountHoverCardFields
    ...ExpenseFormSchemaFeatureFields
    ...ExpenseFormSchemaPolicyFields

    ... on AccountWithHost {
      host {
        ...ExpenseFormSchemaHostFields
      }
    }
    ... on Organization {
      hasHosting
      host {
        ...ExpenseFormSchemaHostFields
      }
    }

    policies {
      id
      EXPENSE_POLICIES {
        invoicePolicy
        receiptPolicy
        titlePolicy
        grantPolicy
      }
    }

    ... on AccountWithParent {
      parent {
        id
        legacyId
        slug
      }
    }

    admins: members(role: ADMIN) {
      totalCount
      nodes {
        id
        account {
          id
          type
          slug
          name
          imageUrl
          ...AccountHoverCardFields
          emails
        }
      }
    }
  }

  fragment ExpenseFormSubmitterFields on Account {
    id
    slug
    type
    isVerified
    name
    imageUrl
    isHost
    isArchived
  }

  fragment ExpenseFormPayeeFields on Account {
    id
    legacyId
    slug
    name
    legalName
    isUSEntity
    type
    isAdmin
    payoutMethods {
      ...ExpenseFormPayoutMethods
    }

    location {
      address
      country
    }

    ... on AccountWithHost {
      host {
        ...ExpenseFormSchemaHostFields
      }
    }
    ... on Organization {
      host {
        ...ExpenseFormSchemaHostFields
      }
    }
    ... on AccountWithParent {
      parent {
        id
        slug
      }
    }
    ... on Vendor {
      ...ExpenseVendorFields
    }
  }

  ${accountHoverCardFieldsFragment}
  ${accountingCategorySelectFieldsFragment}
`;

function getPayeeSlug(values: ExpenseFormValues): string {
  switch (values.payeeSlug) {
    case PAYEE_SLUG_FIND_ACCOUNT_I_ADMINISTER:
    case PAYEE_SLUG_CREATE_LEGAL_ENTITY:
    case PAYEE_SLUG_INVITE:
    case PAYEE_SLUG_INVITE_SOMEONE:
    case PAYEE_SLUG_VENDOR:
    case PAYEE_SLUG_NEW_VENDOR:
      return null;
    case PAYEE_SLUG_INVITE_EXISTING_USER:
      return values.inviteeExistingAccount;
    default:
      return values.payeeSlug;
  }
}

/**
 * The query variables for the given values. Only the paying account, the payee to query, the
 * expense (or draft) and the submitter affect the query.
 */
export function getFormQueryVariables(
  values: ExpenseFormValues,
  startOptions: ExpenseFormStartOptions,
  loggedInUser: LoggedInUser,
): ExpenseFormSchemaQueryVariables {
  const collectiveSlug = values.accountSlug && !values.accountSlug.startsWith('__') ? values.accountSlug : null;
  const payeeSlug = getPayeeSlug(values);
  return {
    collectiveSlug: collectiveSlug,
    hasCollectiveSlug: !!collectiveSlug,
    payeeSlug: payeeSlug,
    hasPayeeSlug: !!payeeSlug,
    hasExpenseId: !!startOptions.expenseId,
    expenseId: startOptions.expenseId,
    expenseKey: startOptions.draftKey,
    hasSubmitterSlug: !!loggedInUser?.collective?.slug,
    submitterSlug: loggedInUser?.collective?.slug,
  };
}
