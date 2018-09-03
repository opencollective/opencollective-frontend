import { GraphQLInt, GraphQLList, GraphQLObjectType } from 'graphql';

import { Member, MemberOf } from '../object/Member';

export const MemberCollection = new GraphQLObjectType({
  name: 'MemberCollection',
  description: 'This represents a collection of Member',
  fields: () => {
    return {
      totalCount: {
        type: GraphQLInt,
        resolve(result) {
          return result.count;
        },
      },
      nodes: {
        type: new GraphQLList(Member),
        resolve(result) {
          return result.rows;
        },
      },
    };
  },
});

export const MemberOfCollection = new GraphQLObjectType({
  name: 'MemberOfCollection',
  description: 'This represents a collection of MemberOf',
  fields: () => {
    return {
      totalCount: {
        type: GraphQLInt,
        resolve(result) {
          return result.count;
        },
      },
      nodes: {
        type: new GraphQLList(MemberOf),
        resolve(result) {
          return result.rows;
        },
      },
    };
  },
});
