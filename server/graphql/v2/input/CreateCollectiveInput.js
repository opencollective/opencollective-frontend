import { GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInputObjectType } from 'graphql';

const CreateCollectiveInput = new GraphQLInputObjectType({
  name: 'CreateCollectiveInput',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    tags: { type: new GraphQLList(GraphQLString) },
    githubHandle: { type: GraphQLString },
  }),
});

export { CreateCollectiveInput };
