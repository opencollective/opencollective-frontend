import { MemberRole as GraphQLV2MemberRole } from '../graphql/types/v2/schema';

enum GraphQLV1MemberRole {
  HOST = 'HOST', // holds money on behalf of the collective
  ADMIN = 'ADMIN', // can approve expenses
  MEMBER = 'MEMBER', // member of the collective but cannot approve expenses
  CONTRIBUTOR = 'CONTRIBUTOR', // occasional contributor (giving time)
  BACKER = 'BACKER', // supporter giving money
  ATTENDEE = 'ATTENDEE', // someone who registered for a free tier (typically a free event ticket)
  FOLLOWER = 'FOLLOWER', // someone interested to follow the activities of the collective/event
  CONNECTED_COLLECTIVE = 'CONNECTED_COLLECTIVE', // this memberCollective is a sub-collective of the collective
  ACCOUNTANT = 'ACCOUNTANT', // Has read access to all financial information and receipts/invoices
}

/**
 * Similar to GraphQLV2 `MemberRole` but includes `CONNECTED_COLLECTIVE` from GraphQLV1
 */
export type ReverseCompatibleMemberRole = GraphQLV1MemberRole | GraphQLV2MemberRole;

export default { ...GraphQLV1MemberRole, ...GraphQLV2MemberRole };
