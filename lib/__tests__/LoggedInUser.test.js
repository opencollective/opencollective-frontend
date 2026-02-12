import LoggedInUser from '../LoggedInUser';

// Define some test collectives
const randomCollective = { legacyId: 1, type: 'COLLECTIVE', slug: 'random-collective' };
const backedCollective = { legacyId: 2, type: 'COLLECTIVE', slug: 'backed-collective' };
const adminCollective = { legacyId: 3, type: 'COLLECTIVE', slug: 'admin-collective' };
const memberCollective = { legacyId: 4, type: 'COLLECTIVE', slug: 'member-collective' };
const hostAdmin = { legacyId: 5, type: 'ORGANIZATION', slug: 'admin-host', isHost: true };
const hostAdminCollective = { legacyId: 6, type: 'COLLECTIVE', slug: 'admin-host-collective', host: hostAdmin };
const hostedCollective = { legacyId: 7, type: 'COLLECTIVE', slug: 'hosted-collective' };
const randomEventCollective = {
  legacyId: 15,
  type: 'EVENT',
  slug: 'random-event-collective',
  parentCollective: randomCollective,
};
const adminEventCollective = {
  legacyId: 16,
  type: 'EVENT',
  slug: 'admin-event-collective',
  parentCollective: randomCollective,
};
const adminEventCollectiveParent = {
  legacyId: 17,
  type: 'EVENT',
  slug: 'admin-event-collective-parent',
  parentCollective: adminCollective,
};

const testUser = new LoggedInUser({
  legacyId: 1000,
  slug: 'test-user-collective',
  memberOf: {
    nodes: [
      { account: backedCollective, role: 'BACKER' },
      { account: adminCollective, role: 'ADMIN' },
      { account: memberCollective, role: 'MEMBER' },
      { account: adminEventCollective, role: 'ADMIN' },
      { account: hostAdmin, role: 'ADMIN' },
      { account: hostedCollective, role: 'HOST' },
    ],
  },
  workspaces: {
    nodes: [
      { account: adminCollective, role: 'ADMIN' },
      { account: adminEventCollective, role: 'ADMIN' },
      { account: hostAdmin, role: 'ADMIN' },
    ],
  },
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
  describe('isAdminOfCollectiveOrHost', () => {
    it('returns true if user can edit collective', () => {
      expect(testUser.isAdminOfCollectiveOrHost(null)).toBe(false);
      expect(testUser.isAdminOfCollectiveOrHost(randomCollective)).toBe(false);
      expect(testUser.isAdminOfCollectiveOrHost(backedCollective)).toBe(false);
      expect(testUser.isAdminOfCollectiveOrHost(memberCollective)).toBe(false);
      expect(testUser.isAdminOfCollectiveOrHost(randomEventCollective)).toBe(false);

      expect(testUser.isAdminOfCollectiveOrHost(adminCollective)).toBe(true);
      expect(testUser.isAdminOfCollectiveOrHost(adminEventCollective)).toBe(true);
      expect(testUser.isAdminOfCollectiveOrHost(adminEventCollectiveParent)).toBe(true);
      expect(testUser.isAdminOfCollectiveOrHost(testUser)).toBe(true);
    });
  });

  describe('isAdminOfCollective', () => {
    it('returns true if user can edit collective', () => {
      expect(testUser.isAdminOfCollective(null)).toBe(false);
      expect(testUser.isAdminOfCollective(randomCollective)).toBe(false);
      expect(testUser.isAdminOfCollective(backedCollective)).toBe(false);
      expect(testUser.isAdminOfCollective(memberCollective)).toBe(false);
      expect(testUser.isAdminOfCollective(randomEventCollective)).toBe(false);

      expect(testUser.isAdminOfCollective(adminCollective)).toBe(true);
      expect(testUser.isAdminOfCollective(adminEventCollective)).toBe(true);
      expect(testUser.isAdminOfCollective(adminEventCollectiveParent)).toBe(true);
      expect(testUser.isAdminOfCollective(testUser)).toBe(true);
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

describe('Comments', () => {
  describe('canEditComment', () => {
    it('returns true if user can edit comment', () => {
      expect(testUser.canEditComment({ account: null })).toBe(false);
      expect(testUser.canEditComment({ account: randomCollective })).toBe(false);
      expect(testUser.canEditComment({ account: backedCollective })).toBe(false);
      expect(testUser.canEditComment({ account: memberCollective })).toBe(false);
      expect(testUser.canEditComment({ account: randomEventCollective })).toBe(false);

      expect(testUser.canEditComment({ account: adminCollective })).toBe(true);
      expect(testUser.canEditComment({ account: adminEventCollective })).toBe(true);
      expect(testUser.canEditComment({ account: randomCollective, fromAccount: testUser })).toBe(true);
      expect(testUser.canEditComment({ account: adminEventCollectiveParent })).toBe(true);
    });
  });
});
