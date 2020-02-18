import { pick } from 'lodash';
import { GraphQLNonNull } from 'graphql';
import { Expense } from '../object/Expense';
import { AccountInput, fetchAccountWithInput } from '../input/AccountInput';
import { ExpenseCreate } from '../input/ExpenseCreate';
import { createExpense as createExpenseLegacy } from '../../v1/mutations/expenses';
import { idDecode, IDENTIFIER_TYPES } from '../identifiers';

const expenseMutations = {
  createExpense: {
    type: Expense,
    description: 'Submit an expense to a collective',
    args: {
      expense: {
        type: new GraphQLNonNull(ExpenseCreate),
        description: 'Expense data',
      },
      account: {
        type: new GraphQLNonNull(AccountInput),
        description: 'Account where the expense will be created',
      },
    },
    async resolve(_, args, req): Promise<object> {
      const payoutMethod = args.expense.payoutMethod;
      if (payoutMethod.id) {
        payoutMethod.id = idDecode(payoutMethod.id, IDENTIFIER_TYPES.EXPENSE);
      }

      // Right now this endpoint uses the old mutation by adapting the data for it. Once we get rid
      // of the `createExpense` endpoint in V1, the actual code to create the expense should be moved
      // here and cleaned.
      return createExpenseLegacy(req.remoteUser, {
        ...pick(args.expense, ['description', 'tags', 'type', 'privateMessage', 'attachments']),
        amount: args.expense.attachments.reduce((total, attachment) => total + attachment.amount, 0),
        PayoutMethod: payoutMethod,
        collective: await fetchAccountWithInput(args.account, req),
      });
    },
  },
};

export default expenseMutations;
