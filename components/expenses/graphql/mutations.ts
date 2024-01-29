import { gql } from '../../../lib/graphql/helpers';

import { accountingCategoryFields, expensePageExpenseFieldsFragment, expenseValuesByRoleFragment } from './fragments';

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
      valuesByRole {
        id
        ...ExpenseValuesByRoleFragment
      }
      accountingCategory {
        id
        ...AccountingCategoryFields
      }
    }
  }
  ${accountingCategoryFields}
  ${expenseValuesByRoleFragment}
`;
