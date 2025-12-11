import { cloneDeep, isEmpty, unset } from 'lodash';

import {
  addDefaultSections,
  getFilteredSectionsForCollective,
  getSectionPath,
  getSectionsNames,
} from '../collective-sections';
import { CollectiveType } from '../constants/collectives';

const expectSectionsToContain = (sections, expectedSectionsNames) => {
  expectedSectionsNames.forEach(section => {
    const sectionPath = getSectionPath(sections, section);
    try {
      expect(sectionPath).not.toBeNull();
    } catch {
      throw new Error(`Expected sections to contain "${section}", got: ${JSON.stringify(sections)}`);
    }
  });
};

const expectSectionsToMatch = (sections, expectedSectionsNames) => {
  let unseenSections = cloneDeep(sections);
  expectedSectionsNames.forEach(section => {
    const sectionPath = getSectionPath(sections, section);
    try {
      expect(sectionPath).not.toBeNull();
      unset(unseenSections, sectionPath);
    } catch {
      throw new Error(`Expected sections to contain "${section}", got: ${JSON.stringify(sections)}`);
    }
  });

  // Remove empty sections & categories
  unseenSections.forEach(e => {
    if (e.type === 'CATEGORY') {
      e.sections = e.sections.filter(Boolean);
    }
  });
  unseenSections = unseenSections.filter(e => e.type !== 'CATEGORY' || e.sections.length > 0);

  if (!isEmpty(unseenSections)) {
    unseenSections.forEach(s => {
      if (s.type === 'CATEGORY') {
        // eslint-disable-next-line no-console
        console.error('Category', s.name, s.sections);
      } else {
        // eslint-disable-next-line no-console
        console.error(s);
      }
    });
    throw new Error(`Got these extra sections`);
  }
};

describe('Collective sections', () => {
  describe('addDefaultSections', () => {
    describe('COLLECTIVE', () => {
      it('Returns the default sections', () => {
        expectSectionsToMatch(addDefaultSections({ type: CollectiveType.COLLECTIVE }, []), [
          'goals',
          'contribute',
          'top-financial-contributors',
          'projects',
          'events',
          'connected-collectives',
          'updates',
          'conversations',
          'budget',
          'contributors',
          'about',
          'our-team',
        ]);
      });
    });

    describe('USER', () => {
      it('Also works with INDIVIDUAL', () => {
        expectSectionsToMatch(addDefaultSections({ type: 'INDIVIDUAL' }, []), ['contributions', 'budget', 'about']);
      });
    });

    describe('ORGANIZATION', () => {
      it('Returns the default sections (projects disabled by default)', () => {
        expectSectionsToMatch(addDefaultSections({ type: CollectiveType.ORGANIZATION }, []), [
          'contributions',
          'transactions',
          'connected-collectives',
          'about',
          'our-team',
        ]);
      });

      it('Returns sections with projects enabled when hasMoneyManagement is true', () => {
        expectSectionsToMatch(addDefaultSections({ type: CollectiveType.ORGANIZATION, hasMoneyManagement: true }, []), [
          'contribute',
          'projects',
          'events',
          'connected-collectives',
          'top-financial-contributors',
          'contributors',
          'budget',
          'updates',
          'conversations',
          'about',
          'our-team',
        ]);
      });

      it('Returns hosting-specific sections when hasHosting is true', () => {
        expectSectionsToMatch(addDefaultSections({ type: CollectiveType.ORGANIZATION, hasHosting: true }, []), [
          'contribute',
          'projects',
          'events',
          'connected-collectives',
          'top-financial-contributors',
          'contributors',
          'contributions',
          'budget',
          'updates',
          'conversations',
          'about',
          'our-team',
        ]);
      });

      it('Does not return hosting-specific sections when hasHosting is false', () => {
        const sections = addDefaultSections({ type: CollectiveType.ORGANIZATION, hasHosting: false }, []);
        const sectionNames = getSectionsNames(sections);
        expect(sectionNames).not.toContain('updates');
        expect(sectionNames).not.toContain('conversations');
      });
    });

    it('Returns an empty array for unknown types', () => {
      expect(addDefaultSections()).toEqual([]);
    });
  });

  describe('getFilteredSectionsForCollective', () => {
    describe('For event', () => {
      const features = {
        RECEIVE_FINANCIAL_CONTRIBUTIONS: 'ACTIVE',
      };

      it('Contribute gets removed if event is passed (even if admin)', () => {
        const event = { type: 'EVENT', isActive: true, features };
        const pastDate = '2000-01-01';
        const futureDate = new Date(new Date().getFullYear() + 1, 1).toUTCString();
        expectSectionsToContain(getFilteredSectionsForCollective({ ...event, endsAt: pastDate }), []);
        expectSectionsToContain(getFilteredSectionsForCollective({ ...event, endsAt: pastDate }, true), []);
        expectSectionsToContain(getFilteredSectionsForCollective({ ...event, endsAt: futureDate }), ['contribute']);
      });
    });
    describe('For collective', () => {
      const features = {
        ABOUT: 'ACTIVE',
        COLLECTIVE_GOALS: 'DISABLED',
        CONVERSATIONS: 'DISABLED',
        UPDATES: 'AVAILABLE',
        RECEIVE_FINANCIAL_CONTRIBUTIONS: 'ACTIVE',
        TRANSACTIONS: 'ACTIVE',
      };

      it('Filters for non-admins', () => {
        const collective = { type: 'COLLECTIVE', features };
        expectSectionsToContain(getFilteredSectionsForCollective({ ...collective, isActive: true }), ['contribute']);
        expectSectionsToContain(getFilteredSectionsForCollective({ ...collective, longDescription: 'Hi' }), ['about']);
      });

      it('Filters for admins', () => {
        const collective = { type: 'COLLECTIVE', features };
        expectSectionsToMatch(getFilteredSectionsForCollective(collective, true), [
          'contribute',
          'contributors',
          'top-financial-contributors',
          'updates',
          'budget',
          'contributors',
          'about',
          'our-team',
        ]);
      });
    });
  });
});
