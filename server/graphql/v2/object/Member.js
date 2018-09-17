import { GraphQLInt, GraphQLEnumType, GraphQLObjectType } from 'graphql';

import { GraphQLDateTime } from 'graphql-iso-date';

import { Account } from '../interface/Account';
import { Amount } from '../object/Amount';

export const MemberRole = new GraphQLEnumType({
  name: 'MemberRole',
  values: {
    BACKER: {},
    ADMIN: {},
    CONTRIBUTOR: {},
    HOST: {},
    ATTENDEE: {},
    MEMBER: {},
    FUNDRAISER: {},
    FOLLOWER: {},
  },
});

const MemberFields = {
  id: {
    type: GraphQLInt,
    resolve(member) {
      return member.id;
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
    description: 'total amount donated by this member',
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
  description: 'This represents a Member',
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
  description: 'This represents a MemberOf',
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
