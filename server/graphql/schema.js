import {
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';

import query from './queries';

const Query = new GraphQLObjectType({
  name: 'Query',
  description: 'This is a root query',
  fields: () => {
    return query
  }
});

const Schema = new GraphQLSchema({
  query: Query
});

export default Schema