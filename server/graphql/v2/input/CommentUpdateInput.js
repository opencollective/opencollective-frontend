import { GraphQLString, GraphQLInputObjectType, GraphQLNonNull } from 'graphql';

/**
 * Input type to use as the type for the comment input in editComment mutation.
 */
export const CommentUpdateInput = new GraphQLInputObjectType({
  name: 'CommentUpdateInput',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    markdown: { type: GraphQLString },
    html: { type: GraphQLString },
  }),
});
