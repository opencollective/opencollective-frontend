import { pick } from 'lodash';
import { GraphQLNonNull } from 'graphql';
import { Expense } from '../object/Expense';
import { AccountReferenceInput, fetchAccountWithReference } from '../input/AccountReferenceInput';
import { ExpenseCreateInput } from '../input/ExpenseCreateInput';
import { createExpense as createExpenseLegacy } from '../../v1/mutations/expenses';
import { idDecode, IDENTIFIER_TYPES } from '../identifiers';

const expenseMutations = {
  createExpense: {
    type: Expense,
    description: 'Submit an expense to a collective',
    args: {
      expense: {
        type: new GraphQLNonNull(ExpenseCreateInput),
        description: 'Expense data',
      },
      account: {
        type: new GraphQLNonNull(AccountReferenceInput),
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
        ...pick(args.expense, ['description', 'tags', 'type', 'privateMessage', 'attachments', 'invoiceInfo']),
        amount: args.expense.attachments.reduce((total, attachment) => total + attachment.amount, 0),
        PayoutMethod: payoutMethod,
        collective: await fetchAccountWithReference(args.account, req),
        fromCollective: args.expense.payee,
      });
    },
  },
};

export default expenseMutations;
