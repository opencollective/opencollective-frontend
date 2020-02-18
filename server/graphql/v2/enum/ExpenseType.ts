import { GraphQLEnumType } from 'graphql';
import expenseType from '../../../constants/expense_type';

export const ExpenseType = new GraphQLEnumType({
  name: 'ExpenseType',
  description: 'All supported expense types',
  values: {
    [expenseType.INVOICE]: {
      description: 'Invoice: Get paid back for a purchase already made.',
    },
    [expenseType.RECEIPT]: {
      description: 'Receipt: Charge for your time or get paid in advance',
    },
  },
});
