import { GraphQLInt, GraphQLInterfaceType } from 'graphql';

/**
 * Interface intended to be implemented by every type that returns a
 * collection of types. The implementing type will look like:
 * {
 *  offset: Int,
 *  limit: Int,
 *  totalCount: Int,
 *  nodes: [<Type>]
 * }
 * By convention the collection of types is called nodes.
 */
const Collection = new GraphQLInterfaceType({
  name: 'Collection',
  description: 'Collection interface shared by all collection types',
  fields() {
    return { ...CollectionFields };
  },
});

/** All the fields Collection interface implementers have to implemented. */
const CollectionFields = {
  offset: {
    type: GraphQLInt,
  },
  limit: {
    type: GraphQLInt,
  },
  totalCount: {
    type: GraphQLInt,
  },
};

/**
 * Types to use as arguments for fields that return types
 * that implement the Collection interface.
 */
const CollectionArgs = {
  limit: { type: GraphQLInt },
  offset: { type: GraphQLInt },
};

export { Collection, CollectionFields, CollectionArgs };
