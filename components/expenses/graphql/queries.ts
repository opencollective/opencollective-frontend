import { gql } from '../../../lib/graphql/helpers';

import { commentFieldsFragment } from '../../conversations/graphql';

import {
  expensePageExpenseFieldsFragment,
  expensePayeeFieldsFragment,
  loggedInAccountExpensePayoutFieldsFragment,
} from './fragments';

export const expensePageQuery = gql`
  query ExpensePage(
    $legacyExpenseId: Int!
    $draftKey: String
    $offset: Int
    $totalPaidExpensesDateFrom: DateTime
    $hostSlug: String
    $includeFiscalHostNote: Boolean! = false
  ) {
    expense(expense: { legacyId: $legacyExpenseId }, draftKey: $draftKey) {
      id
      ...ExpensePageExpenseFields
      account {
        fiscalHostNote(host: { slug: $hostSlug }) @include(if: $includeFiscalHostNote) {
          type
          note
          updatedAt
          updatedBy {
            id
            name
            slug
          }
        }
      }
      createdByAccount {
        fiscalHostNote(host: { slug: $hostSlug }) @include(if: $includeFiscalHostNote) {
          type
          note
          updatedAt
          updatedBy {
            id
            name
            slug
          }
        }
      }
      payee {
        id
        ...ExpensePayeeFields
        fiscalHostNote(host: { slug: $hostSlug }) @include(if: $includeFiscalHostNote) {
          type
          note
          updatedAt
          updatedBy {
            id
            name
            slug
          }
        }
        stats {
          id
          totalPaidExpenses(dateFrom: $totalPaidExpensesDateFrom) {
            valueInCents
            currency
          }
          totalPaidInvoices: totalPaidExpenses(expenseType: [INVOICE], dateFrom: $totalPaidExpensesDateFrom) {
            valueInCents
            currency
          }
          totalPaidReceipts: totalPaidExpenses(expenseType: [RECEIPT], dateFrom: $totalPaidExpensesDateFrom) {
            valueInCents
            currency
          }
          totalPaidGrants: totalPaidExpenses(expenseType: [GRANT], dateFrom: $totalPaidExpensesDateFrom) {
            valueInCents
            currency
          }
        }
      }
      permissions {
        canDeclineExpenseInvite(draftKey: $draftKey)
      }
      comments(limit: 100, offset: $offset) {
        totalCount
        nodes {
          id
          ...CommentFields
        }
      }
    }

    loggedInAccount {
      id
      ...LoggedInAccountExpensePayoutFields
    }
  }

  ${loggedInAccountExpensePayoutFieldsFragment}
  ${expensePageExpenseFieldsFragment}
  ${commentFieldsFragment}
  ${expensePayeeFieldsFragment}
`;
