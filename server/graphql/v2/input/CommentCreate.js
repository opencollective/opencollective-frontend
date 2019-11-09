import { GraphQLString, GraphQLInt, GraphQLInputObjectType, GraphQLNonNull } from 'graphql';

/**
 * Input type to use as the type for the comment input in createComment mutation.
 */
const CommentCreate = new GraphQLInputObjectType({
  name: 'CommentCreate',
  fields: () => ({
    markdown: { type: GraphQLString },
    html: { type: GraphQLString },
    CollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
    ExpenseId: { type: GraphQLInt },
    UpdateId: { type: GraphQLInt },
  }),
});

export { CommentCreate };
