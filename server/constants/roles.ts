enum MemberRoles {
  /** Holds money on behalf of the collective */
  HOST = 'HOST',
  /** Can approve expenses */
  ADMIN = 'ADMIN',
  /** Member of the collective but cannot approve expenses */
  MEMBER = 'MEMBER',
  /** Occasional contributor (giving time) */
  CONTRIBUTOR = 'CONTRIBUTOR',
  /** Supporter giving money */
  BACKER = 'BACKER',
  /** Someone helping to raise money (using referral) deprecated on 2019-08-22 */
  FUNDRAISER = 'FUNDRAISER',
  /** Someone who registered for a free tier (typically a free event ticket) */
  ATTENDEE = 'ATTENDEE',
  /** Someone interested to follow the activities of the collective/event */
  FOLLOWER = 'FOLLOWER',
}

export default MemberRoles;
