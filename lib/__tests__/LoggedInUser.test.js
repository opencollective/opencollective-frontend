import LoggedInUser from '../LoggedInUser';

// Define some test collectives
const randomCollective = { id: 1, type: 'COLLECTIVE', slug: 'random-collective' };
const backedCollective = { id: 2, type: 'COLLECTIVE', slug: 'backed-collective' };
const adminCollective = { id: 3, type: 'COLLECTIVE', slug: 'admin-collective' };
const memberCollective = { id: 4, type: 'COLLECTIVE', slug: 'member-collective' };
const hostAdmin = { id: 5, type: 'ORGANIZATION', slug: 'admin-host', isHost: true };
const hostAdminCollective = { id: 6, type: 'COLLECTIVE', slug: 'admin-host-collective', host: hostAdmin };
const hostedCollective = { id: 7, type: 'COLLECTIVE', slug: 'hosted-collective' };
const randomEventCollective = {
  id: 15,
  type: 'EVENT',
  slug: 'random-event-collective',
  parentCollective: randomCollective,
};
const adminEventCollective = {
  id: 16,
  type: 'EVENT',
  slug: 'admin-event-collective',
  parentCollective: randomCollective,
};
const adminEventCollectiveParent = {
  id: 17,
  type: 'EVENT',
  slug: 'admin-event-collective-parent',
  parentCollective: adminCollective,
};

// Define some test users
const rootUser = new LoggedInUser({
  id: 1,
  memberOf: [{ role: 'ADMIN', collective: { slug: 'opencollective' } }],
});

const testUser = new LoggedInUser({
  id: 2,
  memberOf: [
    { collective: backedCollective, role: 'BACKER' },
    { collective: adminCollective, role: 'ADMIN' },
    { collective: memberCollective, role: 'MEMBER' },
    { collective: adminEventCollective, role: 'ADMIN' },
    { collective: hostAdmin, role: 'ADMIN' },
    { collective: hostedCollective, role: 'HOST' },
  ],
  CollectiveId: 1000,
  collective: {
    id: 1000,
    slug: 'test-user-collective',
  },
});

const randomUser = new LoggedInUser({
  id: 3,
  memberOf: [],
  CollectiveId: 2000,
  collective: { id: 2000, slug: 'random-user-collective' },
});

hostedCollective.host = testUser;

describe('General permissions', () => {
  describe('hasRole', () => {
    it('returns true if user has one of the requested roles', () => {
      expect(testUser.hasRole('ADMIN', randomCollective)).toBe(false);
      expect(testUser.hasRole('ADMIN', backedCollective)).toBe(false);
      expect(testUser.hasRole('BACKER', backedCollective)).toBe(true);
      expect(testUser.hasRole(['ADMIN', 'BACKER'], backedCollective)).toBe(true);
      expect(testUser.hasRole(['ADMIN', 'BACKER'], adminCollective)).toBe(true);
      expect(testUser.hasRole('ADMIN', adminCollective)).toBe(true);
      expect(testUser.hasRole('ADMIN', adminEventCollective)).toBe(true);
      expect(testUser.hasRole('ADMIN', adminEventCollectiveParent)).toBe(false);
    });
  });

  describe('isRoot', () => {
    it('returns true only if user is root', () => {
      expect(rootUser.isRoot()).toBe(true);
      expect(testUser.isRoot()).toBe(false);
    });
  });

  describe('isHostAdmin', () => {
    it('returns true if user is admin of the host', () => {
      expect(testUser.isHostAdmin(null)).toBe(false);
      expect(testUser.isHostAdmin(randomCollective)).toBe(false);
      expect(testUser.isHostAdmin(adminCollective)).toBe(false);
      expect(testUser.isHostAdmin(hostAdminCollective)).toBe(true);
      expect(testUser.isHostAdmin(hostedCollective)).toBe(true);
    });
  });

  describe('hostsUserIsAdminOf', () => {
    it('returns the list of hosts user is admin of', () => {
      expect(testUser.hostsUserIsAdminOf()).toStrictEqual([hostAdmin]);
    });
  });
});

describe('Collectives', () => {
  describe('canEditCollective', () => {
    it('returns true if user can edit collective', () => {
      expect(testUser.canEditCollective(null)).toBe(false);
      expect(testUser.canEditCollective(randomCollective)).toBe(false);
      expect(testUser.canEditCollective(backedCollective)).toBe(false);
      expect(testUser.canEditCollective(memberCollective)).toBe(false);
      expect(testUser.canEditCollective(randomEventCollective)).toBe(false);

      expect(testUser.canEditCollective(adminCollective)).toBe(true);
      expect(testUser.canEditCollective(adminEventCollective)).toBe(true);
      expect(testUser.canEditCollective(adminEventCollectiveParent)).toBe(true);
      expect(testUser.canEditCollective(testUser.collective)).toBe(true);
    });
  });
});

describe('Events', () => {
  describe('canEditEvent', () => {
    it('returns true if user can edit event', () => {
      expect(testUser.canEditEvent(null)).toBe(false);
      expect(testUser.canEditEvent(randomEventCollective)).toBe(false);
      expect(testUser.canEditEvent(adminEventCollective)).toBe(true);
      expect(testUser.canEditEvent(adminEventCollectiveParent)).toBe(true);
    });
  });
});

describe('Expenses', () => {
  describe('canApproveExpense', () => {
    it('returns true if user can approve/reject expense', () => {
      expect(testUser.canApproveExpense({ collective: null })).toBe(false);
      expect(testUser.canApproveExpense({ collective: randomCollective })).toBe(false);
      expect(testUser.canApproveExpense({ collective: backedCollective })).toBe(false);
      expect(testUser.canApproveExpense({ collective: memberCollective })).toBe(false);
      expect(testUser.canApproveExpense({ collective: randomEventCollective })).toBe(false);

      expect(testUser.canApproveExpense({ collective: adminCollective })).toBe(true);
      expect(testUser.canApproveExpense({ collective: adminEventCollective })).toBe(true);
      expect(testUser.canApproveExpense({ collective: hostAdminCollective })).toBe(true);
    });
  });

  describe('canPayExpense', () => {
    it('returns true if user can approve/reject expense', () => {
      expect(testUser.canPayExpense({ collective: null })).toBe(false);
      expect(testUser.canPayExpense({ collective: randomCollective })).toBe(false);
      expect(testUser.canPayExpense({ collective: backedCollective })).toBe(false);
      expect(testUser.canPayExpense({ collective: memberCollective })).toBe(false);
      expect(testUser.canPayExpense({ collective: randomEventCollective })).toBe(false);
      expect(testUser.canPayExpense({ collective: adminCollective })).toBe(false);
      expect(testUser.canPayExpense({ collective: adminEventCollective })).toBe(false);

      // Only host admins can pay expenses
      expect(testUser.canPayExpense({ collective: hostAdminCollective })).toBe(true);
    });
  });

  describe('canEditExpense', () => {
    it('nobody can edit paid expenses', () => {
      const paidExpense = { collective: adminCollective, fromCollective: testUser.collective, status: 'PAID' };
      expect(rootUser.canEditExpense(paidExpense)).toBe(false);
      expect(testUser.canEditExpense(paidExpense)).toBe(false);
    });

    it('users can edit their own expenses only if approved or pending', () => {
      const userExpense = { collective: randomCollective, fromCollective: testUser.collective };

      // Own expense, pending or approved => OK
      expect(testUser.canEditExpense({ ...userExpense, status: 'PENDING' })).toBe(true);
      expect(testUser.canEditExpense({ ...userExpense, status: 'APPROVED' })).toBe(true);

      // Own expense, paid or rejected => Not ok
      expect(testUser.canEditExpense({ ...userExpense, status: 'REJECTED' })).toBe(false);
      expect(testUser.canEditExpense({ ...userExpense, status: 'PAID' })).toBe(false);

      // Someone else's expense => Not ok
      expect(randomUser.canEditExpense({ ...userExpense, status: 'APPROVED' })).toBe(false);
      expect(randomUser.canEditExpense({ ...userExpense, status: 'PENDING' })).toBe(false);
      expect(randomUser.canEditExpense({ ...userExpense, status: 'REJECTED' })).toBe(false);
      expect(randomUser.canEditExpense({ ...userExpense, status: 'PAID' })).toBe(false);
    });

    it('host admins can edit expenses not payed yet', () => {
      const expense = { collective: hostedCollective, fromCollective: randomUser.collective };

      // Pending
      expect(testUser.canEditExpense({ ...expense, status: 'APPROVED' })).toBe(true);
      expect(testUser.canEditExpense({ ...expense, status: 'PENDING' })).toBe(true);
      expect(testUser.canEditExpense({ ...expense, status: 'REJECTED' })).toBe(true);
      expect(testUser.canEditExpense({ ...expense, status: 'PAID' })).toBe(false);
    });
  });
});

describe('Comments', () => {
  describe('canEditComment', () => {
    it('returns true if user can edit comment', () => {
      expect(testUser.canEditComment({ collective: null })).toBe(false);
      expect(testUser.canEditComment({ collective: randomCollective })).toBe(false);
      expect(testUser.canEditComment({ collective: backedCollective })).toBe(false);
      expect(testUser.canEditComment({ collective: memberCollective })).toBe(false);
      expect(testUser.canEditComment({ collective: randomEventCollective })).toBe(false);

      expect(testUser.canEditComment({ collective: adminCollective })).toBe(true);
      expect(testUser.canEditComment({ collective: adminEventCollective })).toBe(true);
      expect(testUser.canEditComment({ collective: randomCollective, fromCollective: testUser.collective })).toBe(true);
      expect(testUser.canEditComment({ collective: adminEventCollectiveParent })).toBe(true);
    });
  });
});
