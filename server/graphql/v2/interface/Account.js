import {
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLInterfaceType,
} from 'graphql';

import { GraphQLDateTime } from 'graphql-iso-date';

import { idEncode } from '../identifiers';

import { HasMembersFields } from '../interface/HasMembers';
import { IsMemberOfFields } from '../interface/IsMemberOf';

import {
  MemberCollection,
  MemberOfCollection,
} from '../collection/MemberCollection';
import { TransactionCollection } from '../collection/TransactionCollection';

import { AccountType } from '../enum/AccountType';
import { TransactionType } from '../enum/TransactionType';

import { MemberRole } from '../object/Member';
import { AccountStats } from '../object/AccountStats';

import { ChronologicalOrder } from '../input/ChronologicalOrder';

import models from '../../../models';

const accountTransactions = {
  type: TransactionCollection,
  args: {
    type: { type: TransactionType },
    limit: { type: GraphQLInt, defaultValue: 10 },
    offset: { type: GraphQLInt, defaultValue: 0 },
    orderBy: {
      type: ChronologicalOrder,
      defaultValue: ChronologicalOrder.defaultValue,
    },
  },
  resolve(collective, args) {
    const where = { CollectiveId: collective.id };

    if (args.type) {
      where.type = args.type;
    }

    console.log({
      where,
      limit: args.limit,
      offset: args.offset,
      order: [args.orderBy.field, args.orderBy.direction],
    });

    return models.Transaction.findAndCountAll({
      where,
      limit: args.limit,
      offset: args.offset,
      order: [[args.orderBy.field, args.orderBy.direction]],
    });
  },
};

export const AccountFields = {
  _internal_id: {
    type: GraphQLInt,
    resolve(transaction) {
      return transaction.id;
    },
  },
  id: {
    type: GraphQLString,
    resolve(collective) {
      return idEncode(collective.id);
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
  transactions: accountTransactions,
};

export const Account = new GraphQLInterfaceType({
  name: 'Account',
  description: 'Account interface',
  fields: () => {
    return {
      _internal_id: {
        type: GraphQLInt,
      },
      id: {
        type: GraphQLString,
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
      transactions: {
        type: TransactionCollection,
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
          type: {
            type: TransactionType,
            description: 'type of transaction (DEBIT/CREDIT)',
          },
          orderBy: {
            type: ChronologicalOrder,
          },
        },
      },
    };
  },
});
