import {
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLInterfaceType,
} from 'graphql';

import { GraphQLDateTime } from 'graphql-iso-date';

import { HasMembersFields } from '../interface/HasMembers';
import { IsMemberOfFields } from '../interface/IsMemberOf';

import {
  MemberCollection,
  MemberOfCollection,
} from '../collection/MemberCollection';
import { AccountType } from '../enum/AccountType';
import { MemberRole } from '../object/Member';
import { AccountStats } from '../object/AccountStats';

export const AccountFields = {
  id: {
    type: GraphQLInt,
    resolve(collective) {
      return collective.id;
    },
  },
  slug: {
    type: GraphQLString,
    resolve(collective) {
      return collective.slug;
    },
  },
  name: {
    type: GraphQLString,
    resolve(collective) {
      return collective.name;
    },
  },
  description: {
    type: GraphQLString,
    resolve(collective) {
      return collective.description;
    },
  },
  createdAt: {
    type: GraphQLDateTime,
    resolve(collective) {
      return collective.createdAt;
    },
  },
  updatedAt: {
    type: GraphQLDateTime,
    resolve(collective) {
      return collective.updatedAt || collective.createdAt;
    },
  },
  stats: {
    type: AccountStats,
    resolve(collective) {
      return collective;
    },
  },
  ...HasMembersFields,
  ...IsMemberOfFields,
};

export const Account = new GraphQLInterfaceType({
  name: 'Account',
  description: 'Account interface',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
      },
      slug: {
        type: GraphQLString,
      },
      name: {
        type: GraphQLString,
      },
      description: {
        type: GraphQLString,
      },
      createdAt: {
        type: GraphQLDateTime,
      },
      updatedAt: {
        type: GraphQLDateTime,
      },
      stats: {
        type: AccountStats,
      },
      members: {
        type: MemberCollection,
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
          role: { type: new GraphQLList(MemberRole) },
          accountType: { type: new GraphQLList(AccountType) },
        },
      },
      memberOf: {
        type: MemberOfCollection,
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
          role: { type: new GraphQLList(MemberRole) },
          accountType: { type: new GraphQLList(AccountType) },
        },
      },
    };
  },
});
