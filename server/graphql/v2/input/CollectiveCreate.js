import { GraphQLString, GraphQLNonNull, GraphQLInputObjectType } from 'graphql';

const CollectiveCreate = new GraphQLInputObjectType({
  name: 'CollectiveCreate',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export { CollectiveCreate };
