import { GraphQLString, GraphQLInt, GraphQLInputObjectType } from 'graphql';

/**
 * Input type to use as the type for the comment input in createComment mutation.
 */
export const CommentCreateInput = new GraphQLInputObjectType({
  name: 'CommentCreateInput',
  fields: () => ({
    markdown: { type: GraphQLString },
    html: { type: GraphQLString },
    ExpenseId: { type: GraphQLInt },
    UpdateId: { type: GraphQLInt },
    ConversationId: { type: GraphQLString },
  }),
});
