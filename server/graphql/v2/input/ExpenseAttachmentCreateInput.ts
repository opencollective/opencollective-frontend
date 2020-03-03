import { GraphQLString, GraphQLInt, GraphQLInputObjectType, GraphQLNonNull } from 'graphql';
import { DateString } from '../../v1/types';

/**
 * Input type to use as the type for the expense input in createExpense mutation.
 */
export const ExpenseAttachmentCreateInput = new GraphQLInputObjectType({
  name: 'ExpenseAttachmentCreateInput',
  fields: {
    amount: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'Amount in cents',
    },
    description: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'What is this attachment about?',
    },
    url: {
      type: GraphQLString,
      description: 'URL of the file linked to this attachment. Must be provided if the expense type is RECEIPT.',
    },
    incurredAt: {
      type: DateString,
      description: 'When was the money spent?',
    },
  },
});
