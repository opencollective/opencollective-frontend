import { gql } from '../../../lib/graphql/helpers';

import { AccountingCategorySelectFieldsFragment } from '@/components/AccountingCategorySelect';

import { expensePageExpenseFieldsFragment, expenseValuesByRoleFragment } from './fragments';

export const editExpenseMutation = gql`
  mutation EditExpense($expense: ExpenseUpdateInput!, $draftKey: String, $isDraftEdit: Boolean) {
    editExpense(expense: $expense, draftKey: $draftKey, isDraftEdit: $isDraftEdit) {
      id
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;

export const editExpenseCategoryMutation = gql`
  mutation EditExpenseCategory($expenseId: String!, $category: AccountingCategoryReferenceInput) {
    editExpense(expense: { id: $expenseId, accountingCategory: $category }) {
      id
      valuesByRole {
        id
        ...ExpenseValuesByRoleFragment
      }
      accountingCategory {
        id
        ...AccountingCategorySelectFields
      }
    }
  }
  ${AccountingCategorySelectFieldsFragment}
  ${expenseValuesByRoleFragment}
`;

export const moveExpenseMutation = gql`
  mutation MoveExpense($expense: ExpenseReferenceInput!, $destinationAccount: AccountReferenceInput!) {
    moveExpense(expense: $expense, destinationAccount: $destinationAccount) {
      id
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;
