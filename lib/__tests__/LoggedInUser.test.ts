import { CollectiveType } from '../constants/collectives';
import MEMBER_ROLE from '../constants/roles';
import type { GraphQLV1Collective } from '../custom_typings/GraphQLV1';
import LoggedInUser from '../LoggedInUser';

const makeCollective = (
  data: Pick<GraphQLV1Collective, 'id' | 'type' | 'slug'> & Partial<GraphQLV1Collective>,
): GraphQLV1Collective => ({
  name: data.slug,
  legalName: data.slug,
  imageUrl: '',
  policies: null,
  ...data,
});

// Define some test collectives
const randomCollective = makeCollective({ id: 1, type: CollectiveType.COLLECTIVE, slug: 'random-collective' });
const backedCollective = makeCollective({ id: 2, type: CollectiveType.COLLECTIVE, slug: 'backed-collective' });
const adminCollective = makeCollective({ id: 3, type: CollectiveType.COLLECTIVE, slug: 'admin-collective' });
const memberCollective = makeCollective({ id: 4, type: CollectiveType.COLLECTIVE, slug: 'member-collective' });
const hostAdmin = makeCollective({ id: 5, type: CollectiveType.ORGANIZATION, slug: 'admin-host', isHost: true });
const hostAdminCollective = makeCollective({
  id: 6,
  type: CollectiveType.COLLECTIVE,
  slug: 'admin-host-collective',
  host: hostAdmin,
});
const hostedCollective = makeCollective({ id: 7, type: CollectiveType.COLLECTIVE, slug: 'hosted-collective' });
const randomEventCollective = makeCollective({
  id: 15,
  type: CollectiveType.EVENT,
  slug: 'random-event-collective',
  parentCollective: randomCollective,
});
const adminEventCollective = makeCollective({
  id: 16,
  type: CollectiveType.EVENT,
  slug: 'admin-event-collective',
  parentCollective: randomCollective,
});
const adminEventCollectiveParent = makeCollective({
  id: 17,
  type: CollectiveType.EVENT,
  slug: 'admin-event-collective-parent',
  parentCollective: adminCollective,
});

const testUser = new LoggedInUser({
  id: 2,
  memberOf: [
    { collective: backedCollective, role: MEMBER_ROLE.BACKER },
    { collective: adminCollective, role: MEMBER_ROLE.ADMIN },
    { collective: memberCollective, role: MEMBER_ROLE.MEMBER },
    { collective: adminEventCollective, role: MEMBER_ROLE.ADMIN },
    { collective: hostAdmin, role: MEMBER_ROLE.ADMIN },
    { collective: hostedCollective, role: MEMBER_ROLE.HOST },
  ],
  CollectiveId: 1000,
  collective: {
    id: 1000,
    slug: 'test-user-collective',
  },
});

Object.assign(hostedCollective, { host: testUser });

describe('General permissions', () => {
  describe('hasRole', () => {
    it('returns true if user has one of the requested roles', () => {
      expect(testUser.hasRole(MEMBER_ROLE.ADMIN, randomCollective)).toBe(false);
      expect(testUser.hasRole(MEMBER_ROLE.ADMIN, backedCollective)).toBe(false);
      expect(testUser.hasRole(MEMBER_ROLE.BACKER, backedCollective)).toBe(true);
      expect(testUser.hasRole([MEMBER_ROLE.ADMIN, MEMBER_ROLE.BACKER], backedCollective)).toBe(true);
      expect(testUser.hasRole([MEMBER_ROLE.ADMIN, MEMBER_ROLE.BACKER], adminCollective)).toBe(true);
      expect(testUser.hasRole(MEMBER_ROLE.ADMIN, adminCollective)).toBe(true);
      expect(testUser.hasRole(MEMBER_ROLE.ADMIN, adminEventCollective)).toBe(true);
      expect(testUser.hasRole(MEMBER_ROLE.ADMIN, adminEventCollectiveParent)).toBe(false);
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
      expect(testUser.isAdminOfCollectiveOrHost(testUser.collective)).toBe(true);
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
      expect(testUser.isAdminOfCollective(testUser.collective)).toBe(true);
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
      expect(testUser.canEditComment({ account: null } as never)).toBe(false);
      expect(testUser.canEditComment({ account: randomCollective } as never)).toBe(false);
      expect(testUser.canEditComment({ account: backedCollective } as never)).toBe(false);
      expect(testUser.canEditComment({ account: memberCollective } as never)).toBe(false);
      expect(testUser.canEditComment({ account: randomEventCollective } as never)).toBe(false);

      expect(testUser.canEditComment({ account: adminCollective } as never)).toBe(true);
      expect(testUser.canEditComment({ account: adminEventCollective } as never)).toBe(true);
      expect(testUser.canEditComment({ account: randomCollective, fromAccount: testUser.collective } as never)).toBe(
        true,
      );
      expect(testUser.canEditComment({ account: adminEventCollectiveParent } as never)).toBe(true);
    });
  });
});
