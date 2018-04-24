import {
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';

import {
  CollectiveInterfaceType,
  CollectiveType,
  CollectiveStatsType,
  UserCollectiveType,
  OrganizationCollectiveType,
  EventCollectiveType,
} from './CollectiveInterface';

import {
  TransactionInterfaceType,
  TransactionOrderType,
  TransactionExpenseType
} from './TransactionInterface';

import query from './queries';
import mutation from './mutations';

const Query = new GraphQLObjectType({
  name: 'Query',
  description: 'This is a root query',
  fields: () => {
    return query
  }
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  description: 'This is the root mutation',
  fields: () => {
    return mutation
  }
})

const Schema = new GraphQLSchema({
  types: [
    CollectiveInterfaceType,
    CollectiveType,
    CollectiveStatsType,
    UserCollectiveType,
    OrganizationCollectiveType,
    EventCollectiveType,
    TransactionInterfaceType,
    TransactionOrderType,
    TransactionExpenseType
  ],
  query: Query,
  mutation: Mutation
});

export default Schema
