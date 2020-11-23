const {
  getDefaultSectionsForCollective,
  filterSectionsForUser,
  filterSectionsByData,
  getFilteredSectionsForCollective,
} = require('../collective-sections');
const { CollectiveType } = require('../constants/collectives');

const features = {
  COLLECTIVE_GOALS: 'DISABLED',
  CONVERSATIONS: 'DISABLED',
  UPDATES: 'DISABLED',
};

describe('Collective sections', () => {
  describe('getDefaultSectionsForCollective', () => {
    describe('COLLECTIVE', () => {
      it('Returns the default sections', () => {
        expect(getDefaultSectionsForCollective(CollectiveType.COLLECTIVE, false)).toEqual([
          'goals',
          'contribute',
          'updates',
          'conversations',
          'budget',
          'contributors',
          'recurring-contributions',
          'about',
        ]);
      });
    });

    describe('USER', () => {
      it('Also works with INDIVIDUAL', () => {
        expect(getDefaultSectionsForCollective('INDIVIDUAL', false)).toEqual([
          'contributions',
          'transactions',
          'recurring-contributions',
          'about',
        ]);
      });
    });

    describe('ORGANIZATION', () => {
      it('Returns the default sections', () => {
        expect(getDefaultSectionsForCollective(CollectiveType.ORGANIZATION, false)).toEqual([
          'contributions',
          'contributors',
          'updates',
          'conversations',
          'transactions',
          'recurring-contributions',
          'about',
        ]);
      });

      it('Returns the default sections when active', () => {
        expect(getDefaultSectionsForCollective(CollectiveType.ORGANIZATION, true)).toEqual([
          'contribute',
          'contributions',
          'contributors',
          'updates',
          'conversations',
          'transactions',
          'budget',
          'recurring-contributions',
          'about',
        ]);
      });
    });

    it('Returns an empty array for unknown types', () => {
      expect(getDefaultSectionsForCollective()).toEqual([]);
    });
  });

  describe('filterSectionsForUser', () => {
    it('Works with legacy sections', () => {
      const sections = ['contribute', 'updates', 'budget'];
      expect(filterSectionsForUser(sections, false, false)).toEqual(sections);
      expect(filterSectionsForUser(sections, true, false)).toEqual(sections);
      expect(filterSectionsForUser(sections, false, true)).toEqual(sections);
      expect(filterSectionsForUser(sections, true, true)).toEqual(sections);
    });

    it('Filters disabled sections', () => {
      const sections = [
        { section: 'contribute', isEnabled: true },
        { section: 'updates', isEnabled: false },
        { section: 'budget', isEnabled: true },
      ];
      const expected = ['contribute', 'budget'];
      expect(filterSectionsForUser(sections, false, false)).toEqual(expected);
      expect(filterSectionsForUser(sections, true, true)).toEqual(expected);
    });

    it('Filters if users do not have access', () => {
      const sections = [
        { section: 'contribute', isEnabled: true },
        { section: 'updates', isEnabled: true, restrictedTo: ['ADMIN'] },
        { section: 'budget', isEnabled: true },
      ];

      const sectionsIfAllowed = ['contribute', 'updates', 'budget'];
      const sectionsIfNotAllowed = ['contribute', 'budget'];
      expect(filterSectionsForUser(sections, false, false)).toEqual(sectionsIfNotAllowed);
      expect(filterSectionsForUser(sections, true, false)).toEqual(sectionsIfAllowed);
      expect(filterSectionsForUser(sections, false, true)).toEqual(sectionsIfAllowed);
      expect(filterSectionsForUser(sections, true, true)).toEqual(sectionsIfAllowed);
    });
  });

  describe('filterSectionsByData', () => {
    describe('Contribute', () => {
      it('Gets removed if not active (unless admin)', () => {
        expect(filterSectionsByData(['contribute'], { isActive: true, features })).toEqual(['contribute']);
        expect(filterSectionsByData(['contribute'], { isActive: false, features })).toEqual([]);
        expect(filterSectionsByData(['contribute'], { isActive: false, features }, true)).toEqual(['contribute']);
      });

      it('Gets removed if no way to contribute (unless admin)', () => {
        const collectiveWithoutContribs = { isActive: true, settings: { disableCustomContributions: true }, features };
        expect(filterSectionsByData(['contribute'], collectiveWithoutContribs)).toEqual([]);
        expect(filterSectionsByData(['contribute'], collectiveWithoutContribs, true)).toEqual(['contribute']);
      });

      it('Gets removed if event is passed (even if admin)', () => {
        const event = { type: 'EVENT', isActive: true, features };
        const pastDate = '2000-01-01';
        const futureDate = new Date(new Date().getFullYear() + 1, 1).toUTCString();
        expect(filterSectionsByData(['contribute'], { ...event, endsAt: pastDate })).toEqual([]);
        expect(filterSectionsByData(['contribute'], { ...event, endsAt: pastDate }, true)).toEqual([]);
        expect(filterSectionsByData(['contribute'], { ...event, endsAt: futureDate })).toEqual(['contribute']);
      });
    });
  });

  describe('getFilteredSectionsForCollective', () => {
    describe('For USER collective', () => {
      it('Filters for non-admins', () => {
        const collective = { type: 'COLLECTIVE', features };
        expect(getFilteredSectionsForCollective(collective)).toEqual(['contributors']);
        expect(getFilteredSectionsForCollective({ ...collective, isActive: true })).toContain('contribute');
        expect(getFilteredSectionsForCollective({ ...collective, longDescription: 'Hi' })).toContain('about');
      });

      it('Filters for admins', () => {
        const collective = { type: 'COLLECTIVE', features };
        expect(getFilteredSectionsForCollective(collective, true)).toEqual([
          'contribute',
          'updates',
          'budget',
          'contributors',
          'about',
        ]);
      });
    });
  });
});
