export default {
  HOST: 'HOST', // holds money on behalf of the collective
  ADMIN: 'ADMIN', // can approve expenses
  MEMBER: 'MEMBER', // member of the collective but cannot approve expenses
  CONTRIBUTOR: 'CONTRIBUTOR', // occasional contributor (giving time)
  BACKER: 'BACKER', // supporter giving money
  FUNDRAISER: 'FUNDRAISER', // someone helping to raise money (using referral) deprecated on 2019-08-22
  ATTENDEE: 'ATTENDEE', // someone who registered for a free tier (typically a free event ticket)
  FOLLOWER: 'FOLLOWER', // someone interested to follow the activities of the collective/event
};
