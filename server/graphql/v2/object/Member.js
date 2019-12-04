import { GraphQLString, GraphQLObjectType } from 'graphql';
// import { GraphQLInt } from 'graphql';

import { GraphQLDateTime } from 'graphql-iso-date';

import { Account } from '../interface/Account';
import { Amount } from '../object/Amount';
import { Tier } from '../object/Tier';
import { MemberRole } from '../enum/MemberRole';

import { idEncode } from '../identifiers';

const MemberFields = {
  // _internal_id: {
  //   type: GraphQLInt,
  //   resolve(member) {
  //     return member.id;
  //   },
  // },
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
  tier: {
    type: Tier,
    resolve(member, args, req) {
      if (member.tier) {
        return member.tier;
      }
      if (member.TierId) {
        return req.loaders.Tier.byId.load(member.TierId);
      }
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
  since: {
    type: GraphQLDateTime,
    resolve(member) {
      return member.since;
    },
  },
  totalDonations: {
    type: Amount,
    description: 'Total amount donated',
    async resolve(member, args, req) {
      if (member.totalDonations) {
        return { value: member.totalDonations };
      }
      const value = await req.loaders.Transaction.totalAmountDonatedFromTo.load({
        FromCollectiveId: member.MemberCollectiveId,
        CollectiveId: member.CollectiveId,
      });
      return { value };
    },
  },
};

export const Member = new GraphQLObjectType({
  name: 'Member',
  description: 'This represents a Member relationship (ie: Organization backing a Collective)',
  fields: () => {
    return {
      ...MemberFields,
      account: {
        type: Account,
        resolve(member, args, req) {
          return member.memberCollective || req.loaders.Collective.byId.load(member.MemberCollectiveId);
        },
      },
    };
  },
});

export const MemberOf = new GraphQLObjectType({
  name: 'MemberOf',
  description: 'This represents a MemberOf relationship (ie: Collective backed by an Organization)',
  fields: () => {
    return {
      ...MemberFields,
      account: {
        type: Account,
        resolve(member, args, req) {
          return member.collective || req.loaders.Collective.byId.load(member.CollectiveId);
        },
      },
    };
  },
});
