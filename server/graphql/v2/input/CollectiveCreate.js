import { GraphQLInt, GraphQLString, GraphQLInputObjectType } from 'graphql';

const CollectiveCreate = new GraphQLInputObjectType({
  name: 'CollectiveCreate',
  fields: () => ({
    name: { type: GraphQLString },
    slug: { type: GraphQLString },
    description: { type: GraphQLString },
    // TODO: replace by hashId or slug
    HostCollectiveId: { type: GraphQLInt },
  }),
});

export { CollectiveCreate };
