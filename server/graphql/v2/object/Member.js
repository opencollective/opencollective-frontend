import { GraphQLInt, GraphQLString, GraphQLObjectType } from 'graphql';

import { GraphQLDateTime } from 'graphql-iso-date';

import { Account } from '../interface/Account';
import { Amount } from '../object/Amount';
import { MemberRole } from '../enum/MemberRole';

import { idEncode } from '../identifiers';

const MemberFields = {
  _internal_id: {
    type: GraphQLInt,
    resolve(member) {
      return member.id;
    },
  },
  id: {
    type: GraphQLString,
    resolve(member) {
      return idEncode(member.id, 'member');
    },
  },
  role: {
    type: MemberRole,
    resolve(member) {
      return member.role;
    },
  },
  createdAt: {
    type: GraphQLDateTime,
    resolve(member) {
      return member.createdAt;
    },
  },
  updatedAt: {
    type: GraphQLDateTime,
    resolve(member) {
      return member.updatedAt;
    },
  },
  totalDonations: {
    type: Amount,
    description: 'Total amount donated',
    resolve(member, args, req) {
      return (
        member.totalDonations ||
        req.loaders.transactions.totalAmountDonatedFromTo.load({
          FromCollectiveId: member.MemberCollectiveId,
          CollectiveId: member.CollectiveId,
        })
      );
    },
  },
};

export const Member = new GraphQLObjectType({
  name: 'Member',
  description:
    'This represents a Member relationship (ie: Organization backing a Collective)',
  fields: () => {
    return {
      ...MemberFields,
      account: {
        type: Account,
        resolve(member, args, req) {
          return (
            member.memberCollective ||
            req.loaders.collective.findById.load(member.MemberCollectiveId)
          );
        },
      },
    };
  },
});

export const MemberOf = new GraphQLObjectType({
  name: 'MemberOf',
  description:
    'This represents a MemberOf relationship (ie: Collective backed by an Organization)',
  fields: () => {
    return {
      ...MemberFields,
      account: {
        type: Account,
        resolve(member, args, req) {
          return (
            member.collective ||
            req.loaders.collective.findById.load(member.CollectiveId)
          );
        },
      },
    };
  },
});
