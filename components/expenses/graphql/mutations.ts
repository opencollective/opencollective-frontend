import { gql } from '@apollo/client';

import { expensePageExpenseFieldsFragment } from './fragments';

export const editExpenseMutation = gql`
  mutation EditExpense($expense: ExpenseUpdateInput!, $draftKey: String) {
    editExpense(expense: $expense, draftKey: $draftKey) {
      id
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;

export const editExpenseCategoryMutation = gql`
  mutation EditExpenseCategory($expenseId: String!, $category: AccountingCategoryReferenceInput!) {
    editExpense(expense: { id: $expenseId, accountingCategory: $category }) {
      id
      accountingCategory {
        id
        name
        friendlyName
        code
      }
    }
  }
`;
