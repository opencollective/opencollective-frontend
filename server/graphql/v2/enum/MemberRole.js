import { GraphQLEnumType } from 'graphql';

export const MemberRole = new GraphQLEnumType({
  name: 'MemberRole',
  description: 'All member roles',
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
