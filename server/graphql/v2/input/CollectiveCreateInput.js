import { GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInputObjectType } from 'graphql';

export const CollectiveCreateInput = new GraphQLInputObjectType({
  name: 'CollectiveCreateInput',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    tags: { type: new GraphQLList(GraphQLString) },
    githubHandle: { type: GraphQLString },
  }),
});
