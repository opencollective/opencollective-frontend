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

export const verifyExpenseMutation = gql`
  mutation VerifyExpense($expense: ExpenseReferenceInput!, $draftKey: String) {
    verifyExpense(expense: $expense, draftKey: $draftKey) {
      id
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;
