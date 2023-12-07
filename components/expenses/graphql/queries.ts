import { gql } from '@apollo/client';

import { commentFieldsFragment } from '../../conversations/graphql';

import { expensePageExpenseFieldsFragment, loggedInAccountExpensePayoutFieldsFragment } from './fragments';

export const expensePageQuery = gql`
  query ExpensePage($legacyExpenseId: Int!, $draftKey: String, $offset: Int, $totalPaidExpensesDateFrom: DateTime) {
    expense(expense: { legacyId: $legacyExpenseId }, draftKey: $draftKey) {
      id
      ...ExpensePageExpenseFields
      comments(limit: 100, offset: $offset) {
        totalCount
        nodes {
          id
          ...CommentFields
        }
      }
    }

    # As it uses a dedicated variable this needs to be separated from the ExpensePageExpenseFields fragment
    expensePayeeStats: expense(expense: { legacyId: $legacyExpenseId }) {
      id
      payee {
        id
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
    }

    loggedInAccount {
      id
      ...LoggedInAccountExpensePayoutFields
    }
  }

  ${loggedInAccountExpensePayoutFieldsFragment}
  ${expensePageExpenseFieldsFragment}
  ${commentFieldsFragment}
`;
