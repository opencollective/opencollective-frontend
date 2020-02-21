import { GraphQLString, GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from 'graphql';
import { ExpenseType } from '../enum/ExpenseType';
import { ExpenseAttachmentCreate } from './ExpenseAttachmentCreate';
import { PayoutMethodInput } from './PayoutMethodInput';
import { AccountInput } from './AccountInput';

/**
 * Input type to use as the type for the expense input in createExpense mutation.
 */
const ExpenseCreate = new GraphQLInputObjectType({
  name: 'ExpenseCreate',
  fields: {
    description: { type: new GraphQLNonNull(GraphQLString) },
    tags: { type: new GraphQLList(GraphQLString) },
    type: { type: new GraphQLNonNull(ExpenseType) },
    privateMessage: {
      type: GraphQLString,
      description: 'A private note that will be attached to your invoice',
    },
    invoiceInfo: {
      type: GraphQLString,
      description: 'Tax ID, VAT number...etc This information will be printed on your invoice.',
    },
    payoutMethod: {
      type: new GraphQLNonNull(PayoutMethodInput),
      description: 'The payout method that will be used to reimburse the expense',
    },
    attachments: {
      type: new GraphQLNonNull(new GraphQLList(ExpenseAttachmentCreate)),
      description: 'The list of attachments for this expense. Total amount will be computed from them.',
    },
    fromAccount: {
      type: new GraphQLNonNull(AccountInput),
      description: 'Account to reimburse',
    },
  },
});

export { ExpenseCreate };
