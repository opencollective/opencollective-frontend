import { GraphQLList, GraphQLObjectType } from 'graphql';

import { Account } from '../interface/Account';
import { Collection, CollectionFields } from '../interface/Collection';

const AccountCollection = new GraphQLObjectType({
  name: 'AccountCollection',
  interfaces: [Collection],
  description: 'A collection of "Accounts"',
  fields: () => {
    return {
      ...CollectionFields,
      nodes: {
        type: new GraphQLList(Account),
      },
    };
  },
});

export { AccountCollection };
