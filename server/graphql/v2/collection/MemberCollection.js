import { GraphQLInt, GraphQLList, GraphQLObjectType } from 'graphql';

import { Member, MemberOf } from '../object/Member';

export const MemberCollection = new GraphQLObjectType({
  name: 'MemberCollection',
  description: 'A collection of "Members" (ie: Organization backing a Collective)',
  fields: () => {
    return {
      offset: {
        type: GraphQLInt,
        resolve(result) {
          return result.offset;
        },
      },
      limit: {
        type: GraphQLInt,
        resolve(result) {
          return result.limit;
        },
      },
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
  description: 'A collection of "MemberOf" (ie: Collective backed by an Organization)',
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
