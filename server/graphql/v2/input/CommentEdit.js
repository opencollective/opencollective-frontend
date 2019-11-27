import { GraphQLString, GraphQLInputObjectType, GraphQLNonNull } from 'graphql';

/**
 * Input type to use as the type for the comment input in editComment mutation.
 */
const CommentEdit = new GraphQLInputObjectType({
  name: 'CommentEdit',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    markdown: { type: GraphQLString },
    html: { type: GraphQLString },
  }),
});

export { CommentEdit };
