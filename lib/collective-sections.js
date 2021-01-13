/**
 * There are 3 levels of filtering to know if a section should appear or not:
 *
 * 1. Status of the collective: the `type`, `isActive`
 * 2. User's permissions: certain sections are displayed only to admins
 * 3. The data: we won't display a section if it's empty
 *
 * The logic for these checks is progressively moving to the API, relying on the "features"
 * field to know which features user has access to.
 */

import { cloneDeep, flatten, get, remove } from 'lodash';

import { Sections } from '../components/collective-page/_constants';

import { CollectiveType } from './constants/collectives';
import hasFeature, { FEATURES } from './allowed-features';
import { isEmptyCollectiveLocation } from './collective.lib';
import { getEnvVar } from './env-utils';
import { canOrderTicketsFromEvent, isPastEvent } from './events';
import { parseToBoolean } from './utils';

// Define default sections based on collective type
const DEFAULT_SECTIONS = {
  [CollectiveType.ORGANIZATION]: [
    Sections.CONTRIBUTE,
    Sections.CONTRIBUTIONS,
    Sections.CONTRIBUTORS,
    Sections.UPDATES,
    Sections.CONVERSATIONS,
    Sections.TRANSACTIONS,
    Sections.BUDGET,
    Sections.RECURRING_CONTRIBUTIONS,
    Sections.ABOUT,
  ],
  [CollectiveType.USER]: [
    Sections.CONTRIBUTIONS,
    Sections.TRANSACTIONS,
    Sections.RECURRING_CONTRIBUTIONS,
    Sections.ABOUT,
  ],
  [CollectiveType.COLLECTIVE]: [
    Sections.GOALS,
    Sections.CONTRIBUTE,
    Sections.UPDATES,
    Sections.CONVERSATIONS,
    Sections.BUDGET,
    Sections.CONTRIBUTORS,
    Sections.RECURRING_CONTRIBUTIONS,
    Sections.ABOUT,
  ],
  [CollectiveType.FUND]: [
    Sections.CONTRIBUTE,
    Sections.UPDATES,
    Sections.PROJECTS,
    Sections.BUDGET,
    Sections.CONTRIBUTIONS,
    Sections.CONTRIBUTORS,
    Sections.ABOUT,
  ],
  [CollectiveType.EVENT]: [
    Sections.ABOUT,
    Sections.TICKETS,
    Sections.CONTRIBUTE,
    Sections.PARTICIPANTS,
    Sections.LOCATION,
    Sections.BUDGET,
  ],
  [CollectiveType.PROJECT]: [Sections.ABOUT, Sections.CONTRIBUTE, Sections.BUDGET],
};

// we need to add Sections.CONNECTED_COLLECTIVES
const DEFAULT_SECTIONS_V2 = {
  [CollectiveType.ORGANIZATION]: [
    Sections.CONTRIBUTE,
    Sections.CONNECTED_COLLECTIVES,
    Sections.RECURRING_CONTRIBUTIONS,
    Sections.TOP_FINANCIAL_CONTRIBUTORS,
    Sections.EVENTS,
    Sections.BUDGET,
    Sections.UPDATES,
    Sections.CONVERSATIONS,
    Sections.ABOUT,
    Sections.OUR_TEAM,
  ],
  [CollectiveType.COLLECTIVE]: [
    Sections.GOALS,
    Sections.CONTRIBUTE,
    Sections.EVENTS,
    Sections.CONNECTED_COLLECTIVES,
    Sections.RECURRING_CONTRIBUTIONS,
    Sections.CONTRIBUTORS,
    Sections.TOP_FINANCIAL_CONTRIBUTORS,
    Sections.BUDGET,
    Sections.UPDATES,
    Sections.CONVERSATIONS,
    Sections.ABOUT,
    Sections.OUR_TEAM,
  ],
  [CollectiveType.USER]: [
    Sections.CONTRIBUTIONS,
    Sections.RECURRING_CONTRIBUTIONS,
    Sections.TRANSACTIONS,
    Sections.ABOUT,
  ],
  [CollectiveType.EVENT]: [
    Sections.ABOUT,
    Sections.OUR_TEAM,
    Sections.CONTRIBUTE,
    Sections.PARTICIPANTS,
    Sections.BUDGET,
  ],
  [CollectiveType.FUND]: [
    Sections.CONTRIBUTE,
    Sections.RECURRING_CONTRIBUTIONS,
    Sections.CONTRIBUTORS,
    Sections.TOP_FINANCIAL_CONTRIBUTORS,
    Sections.PROJECTS,
    Sections.BUDGET,
    Sections.ABOUT,
    Sections.OUR_TEAM,
  ],
  [CollectiveType.PROJECT]: [
    Sections.ABOUT,
    Sections.OUR_TEAM,
    Sections.CONTRIBUTE,
    Sections.CONTRIBUTORS,
    Sections.BUDGET,
  ],
};

/**
 * 1. Returns all the sections than can be used for this collective
 */
export const getDefaultSectionsForCollective = (type, isActive, hasNewCollectiveNavbar) => {
  // Layer of compatibility with GQLV2
  const typeKey = type === 'INDIVIDUAL' ? 'USER' : type;

  // and implement a migration strategy if we want to make changes to them
  const defaultSections = (hasNewCollectiveNavbar ? DEFAULT_SECTIONS_V2[typeKey] : DEFAULT_SECTIONS[typeKey]) || [];

  if (type === CollectiveType.ORGANIZATION && !isActive) {
    return defaultSections.filter(s => ![Sections.CONTRIBUTE, Sections.BUDGET].includes(s));
  } else {
    return defaultSections;
  }
};

/**
 * 2. Returns all the sections than can be used for this collective
 */
export const filterSectionsForUser = (collectiveSections, isAdmin, isHostAdmin) => {
  const sections = [];
  collectiveSections.forEach(sectionData => {
    if (typeof sectionData === 'string') {
      sections.push(sectionData);
    } else if (sectionData.isEnabled) {
      if (sectionData.restrictedTo && sectionData.restrictedTo.includes('ADMIN')) {
        if (isAdmin || isHostAdmin) {
          sections.push(sectionData.section);
        }
      } else {
        sections.push(sectionData.section);
      }
    }
  });

  return sections;
};

/**
 * 3. Filter the sections based on the data available
 */
export const filterSectionsByData = (sections, collective, isAdmin, isHostAdmin) => {
  const toRemove = new Set();
  collective = collective || {};
  const isEvent = collective.type === CollectiveType.EVENT;
  const isFund = collective.type === CollectiveType.FUND;

  // Can't contribute anymore if the collective is archived or has no host
  const hasCustomContribution = !collective.settings?.disableCustomContributions;
  const hasTiers = Boolean(collective.tiers?.length || hasCustomContribution);
  const hasContribute = collective.isActive && hasTiers;
  const hasOtherWaysToContribute =
    !isEvent && (collective.events?.length > 0 || collective.connectedCollectives?.length > 0);
  if ((!hasContribute && !hasOtherWaysToContribute && !isAdmin) || isPastEvent(collective)) {
    toRemove.add(Sections.CONTRIBUTE);
  }

  // Check opt-in features
  if (!hasFeature(collective, FEATURES.COLLECTIVE_GOALS)) {
    toRemove.add(Sections.GOALS);
  }

  if (!hasFeature(collective, FEATURES.CONVERSATIONS)) {
    toRemove.add(Sections.CONVERSATIONS);
  }

  // Some sections are hidden for non-admins (usually when there's no data)
  const { updates, transactions, balance } = collective.stats || {};
  const expenses = collective.expenses || [];
  if (!isAdmin) {
    if (!updates) {
      toRemove.add(Sections.UPDATES);
    }
    if (!collective.hasLongDescription && !collective.longDescription) {
      toRemove.add(Sections.ABOUT);
    }
    if (isFund && !collective.projects?.length) {
      toRemove.add(Sections.PROJECTS);
    }
  }

  if (!isAdmin && !isHostAdmin) {
    if (!collective.balance && !balance && !(transactions && transactions.all) && !expenses.length) {
      toRemove.add(Sections.BUDGET);
    }
  }

  if (collective.type === CollectiveType.ORGANIZATION) {
    if (!hasFeature(collective, FEATURES.UPDATES)) {
      toRemove.add(Sections.UPDATES);
    }
    if (!collective.isActive) {
      toRemove.add(Sections.BUDGET);
    } else {
      toRemove.add(Sections.TRANSACTIONS);
    }
  }

  // Contributions - remove from navbar for collectives who haven't made any
  const memberOf = get(collective, 'memberOf', []);
  const connectedCollectives = get(collective, 'connectedCollectives', []);
  const hostedCollectives = get(collective, 'plan.hostedCollectives', null);
  if (!memberOf?.length && !connectedCollectives?.length && !hostedCollectives) {
    toRemove.add(Sections.CONTRIBUTIONS);
  }
  // don't display Recurring Contributions for TYPE=COLLECTIVE || ORGANIZATION if no active contributions
  if (collective.type === CollectiveType.COLLECTIVE || collective.type === CollectiveType.ORGANIZATION) {
    if (!collective.ordersFromCollective?.some(collective => collective.isSubscriptionActive)) {
      toRemove.add(Sections.RECURRING_CONTRIBUTIONS);
    }
  }

  if (isEvent) {
    // Should not see tickets section if you can't order them
    if ((!hasContribute && !isAdmin) || (!canOrderTicketsFromEvent(collective) && !isAdmin)) {
      toRemove.add(Sections.TICKETS);
    }

    if (!collective.orders || collective.orders.length === 0) {
      toRemove.add(Sections.PARTICIPANTS);
    }

    if (!(collective.location && collective.location.name)) {
      toRemove.add(Sections.LOCATION);
    }
  }

  // Remove standalone Events section unless using the new navbar feature flag (for now)
  toRemove.add(Sections.EVENTS);

  return sections.filter(section => !toRemove.has(section));
};

// Navigation v2
export const filterSectionsByDataV2 = (sections, collective, isAdmin, isHostAdmin) => {
  const toRemove = getSectionsToRemoveForUser(collective, isAdmin, isHostAdmin, true);

  sections = sections.filter(e => e.type !== 'SECTION' || (!toRemove.has(e.name) && e.isEnabled));
  sections.forEach(e => {
    if (e.type === 'CATEGORY') {
      e.sections = e.sections.filter(e => !toRemove.has(e.name) && e.isEnabled);
    }
  });

  // Filter empty categories
  return sections.filter(e => e.type !== 'CATEGORY' || e.sections.length > 0);
};

const getSectionsToRemoveForUser = (collective, isAdmin, isHostAdmin, hasNewCollectiveNavbar) => {
  const toRemove = new Set();
  collective = collective || {};

  if (hasNewCollectiveNavbar && collective.features) {
    const hasAccessToFeature = feature => {
      const status = collective.features[feature];
      return status === 'ACTIVE' || (status === 'AVAILABLE' && isAdmin);
    };

    if (!hasAccessToFeature(FEATURES.RECEIVE_FINANCIAL_CONTRIBUTIONS)) {
      toRemove.add(Sections.CONTRIBUTE);
      toRemove.add(Sections.TOP_FINANCIAL_CONTRIBUTORS);
    }
    if (!hasAccessToFeature(FEATURES.PROJECTS)) {
      toRemove.add(Sections.PROJECTS);
    }
    if (!hasAccessToFeature(FEATURES.COLLECTIVE_GOALS)) {
      toRemove.add(Sections.GOALS);
    }
    if (collective.features[FEATURES.RECURRING_CONTRIBUTIONS] !== 'ACTIVE') {
      toRemove.add(Sections.RECURRING_CONTRIBUTIONS);
    }
    if (collective.features[FEATURES.TRANSACTIONS] !== 'ACTIVE') {
      toRemove.add(Sections.TRANSACTIONS);
      toRemove.add(Sections.BUDGET);
      if (!collective.memberOf?.length) {
        toRemove.add(Sections.CONTRIBUTIONS);
      }
    }
    if (!hasAccessToFeature(FEATURES.EVENTS)) {
      toRemove.add(Sections.EVENTS);
    }
    if (!hasAccessToFeature(FEATURES.UPDATES)) {
      toRemove.add(Sections.UPDATES);
    }
    if (!hasAccessToFeature(FEATURES.CONVERSATIONS)) {
      toRemove.add(Sections.CONVERSATIONS);
    }
    if (collective.features[FEATURES.CONNECTED_ACCOUNTS] !== 'ACTIVE') {
      // If there's no connected accounts, there's no benefit in enabling the section as it will return null anyway
      toRemove.add(Sections.CONNECTED_COLLECTIVES);
    }
    if (!collective.hasLongDescription && !collective.longDescription && !isAdmin && !isHostAdmin) {
      toRemove.add(Sections.ABOUT);
    }
    if (isEmptyCollectiveLocation(collective)) {
      toRemove.add(Sections.LOCATION);
    }
  } else {
    // --- @deprecated Legacy way to check for sections, it is now done through `features`
    const isEvent = collective.type === CollectiveType.EVENT;
    const isFund = collective.type === CollectiveType.FUND;

    // CONTRIBUTE/CONTRIBUTIONS
    // Can't contribute anymore if the collective is archived or has no host
    const hasCustomContribution = !collective.settings?.disableCustomContributions;
    const hasTiers = Boolean(collective.tiers?.length || hasCustomContribution);
    const hasContribute = collective.isActive && hasTiers;
    const hasOtherWaysToContribute = collective.connectedCollectives?.length > 0;
    if (!hasContribute && !hasOtherWaysToContribute && !isAdmin) {
      toRemove.add(Sections.CONTRIBUTE);
    }
    // Hide contribute section on past events
    if (isPastEvent(collective)) {
      toRemove.add(Sections.CONTRIBUTE);
    }
    // hide section CONTRIBUTIONS if no contributions and no recurring contributions
    // Contributions - remove from navbar for collectives who haven't made any
    const memberOf = get(collective, 'memberOf', []);
    const connectedCollectives = get(collective, 'connectedCollectives', []);
    const hostedCollectives = get(collective, 'plan.hostedCollectives', null);
    if (!memberOf?.length && !connectedCollectives?.length && !hostedCollectives) {
      toRemove.add(Sections.CONTRIBUTIONS);
    }
    // don't display Recurring Contributions for TYPE=COLLECTIVE || ORGANIZATION if no active contributions
    if (collective.type === CollectiveType.COLLECTIVE || collective.type === CollectiveType.ORGANIZATION) {
      if (!collective.ordersFromCollective?.some(collective => collective.isSubscriptionActive)) {
        toRemove.add(Sections.RECURRING_CONTRIBUTIONS);
      }
    }

    // EVENTS/PROJECTS
    // If collective has no events, hide from non-admins
    if (!isEvent && !collective.events?.length && !isAdmin && !isHostAdmin) {
      toRemove.add(Sections.EVENTS);
    }
    // If fund has no projects, hide section
    if (isFund && collective.projects?.length > 0) {
      toRemove.add(Sections.PROJECTS);
    }

    // BUDGET/TRANSACTIONS
    // To do: calculate what to do if transactions/expenses is empty but goals isn't??
    const { transactions, balance } = collective.stats || {};
    const expenses = collective.expenses || [];
    if (!collective.balance && !balance && !(transactions && transactions.all) && !expenses.length) {
      toRemove.add(Sections.BUDGET);
    }

    // ABOUT
    // Hide from non-admins if empty
    if (!collective.hasLongDescription && !collective.longDescription && !isAdmin && !isHostAdmin) {
      toRemove.add(Sections.ABOUT);
    }
  }

  return toRemove;
};

/**
 * Combine all the previous steps to directly get the sections that should be
 * displayed for the user.
 */
export const getFilteredSectionsForCollective = (collective, isAdmin, isHostAdmin, hasNewCollectiveNavbar) => {
  let sections;
  const hasNewSectionsFormat = get(collective, 'settings.collectivePage.useNewSections');
  const collectiveSections = get(collective, 'settings.collectivePage.sections');
  if (hasNewCollectiveNavbar && hasNewSectionsFormat && collectiveSections) {
    sections = cloneDeep(collectiveSections);
    // Filter sections
    const toRemove = getSectionsToRemoveForUser(collective, isAdmin, isHostAdmin, hasNewCollectiveNavbar);
    sections = sections.filter(e => e.type !== 'SECTION' || (e.isEnabled && !toRemove.has(e.name)));
    sections.forEach(e => {
      if (e.type === 'CATEGORY') {
        e.sections = e.sections.filter(e => e.isEnabled && !toRemove.has(e.name));
      }
    });

    // Filter empty categories
    return sections.filter(e => e.type !== 'CATEGORY' || e.sections.length > 0);
  }

  sections = collectiveSections || getDefaultSectionsForCollective(collective?.type, collective?.isActive);

  if (hasNewCollectiveNavbar) {
    const hasStringFormat = typeof collectiveSections?.[0] === 'string';
    sections = convertSectionsToNewFormat(sections, collective?.type);
    if (!collective) {
      return sections;
    }

    sections = addDefaultSections(collective, sections, !hasStringFormat);
    return filterSectionsByDataV2(sections, collective, isAdmin, isHostAdmin);
  } else {
    if (hasNewSectionsFormat) {
      sections = convertSectionsToLegacyFormat(sections);
    }
    sections = filterSectionsForUser(sections, isAdmin, isHostAdmin);
    return filterSectionsByData(sections, collective, isAdmin, isHostAdmin);
  }
};

export const NAVBAR_CATEGORIES = {
  ABOUT: 'ABOUT',
  BUDGET: 'BUDGET',
  CONNECT: 'CONNECT',
  CONTRIBUTE: 'CONTRIBUTE',
  CONTRIBUTIONS: 'CONTRIBUTIONS',
  EVENTS: 'EVENTS', // Events, projects, connected collectives
};

/**
 * Map sections to their categories. Any section that's not in this object will be considered
 * as a "Widget" (aka. a section without navbar category).
 */
const SECTIONS_CATEGORIES = {
  // About
  [Sections.OUR_TEAM]: NAVBAR_CATEGORIES.ABOUT,
  [Sections.ABOUT]: NAVBAR_CATEGORIES.ABOUT,
  [Sections.LOCATION]: NAVBAR_CATEGORIES.ABOUT,
  // Connect
  [Sections.CONVERSATIONS]: NAVBAR_CATEGORIES.CONNECT,
  [Sections.UPDATES]: NAVBAR_CATEGORIES.CONNECT,
  // Contribute
  [Sections.TICKETS]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.CONTRIBUTE]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.CONTRIBUTORS]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.TOP_FINANCIAL_CONTRIBUTORS]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.PARTICIPANTS]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.EVENTS]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.PROJECTS]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.CONNECTED_COLLECTIVES]: NAVBAR_CATEGORIES.CONTRIBUTE,
  // Contributions
  [Sections.CONTRIBUTIONS]: NAVBAR_CATEGORIES.CONTRIBUTIONS,
  [Sections.RECURRING_CONTRIBUTIONS]: NAVBAR_CATEGORIES.CONTRIBUTIONS,
  // Budget
  [Sections.BUDGET]: NAVBAR_CATEGORIES.BUDGET,
};

export const getSectionCategory = sectionName => {
  return SECTIONS_CATEGORIES[sectionName];
};

const convertSectionToNewFormat = ({ section, isEnabled, restrictedTo = null }) => ({
  type: 'SECTION',
  name: section,
  isEnabled,
  restrictedTo,
});

const normalizeLegacySection = section => {
  if (typeof section === 'string') {
    return { section, isEnabled: true };
  } else {
    return section;
  }
};

/**
 * Converts legacy sections to their new format
 */
export const convertSectionsToNewFormat = (sections, collectiveType) => {
  const sectionsToConvert = sections.map(normalizeLegacySection);
  const convertedSections = [];

  if (!sectionsToConvert.length) {
    return [];
  }

  do {
    const section = sectionsToConvert[0];
    const category = SECTIONS_CATEGORIES[section.section];

    if (section.type) {
      // Already new format
      sectionsToConvert.shift();
    } else if (!category) {
      // Simple case: section is a widget (not part of any category)
      convertedSections.push(convertSectionToNewFormat(section));
      sectionsToConvert.shift();
    } else {
      // If part of a category, create it and store all alike sections
      const allCategorySections = remove(sectionsToConvert, s => SECTIONS_CATEGORIES[s.section] === category);
      const convertedSubSections = allCategorySections.map(convertSectionToNewFormat);

      if (category === NAVBAR_CATEGORIES.CONTRIBUTE) {
        // We want to make sure TOP_FINANCIAL_CONTRIBUTORS and EVENTS are inserted at the right place
        const contributeSectionIdx = convertedSubSections.findIndex(s => s.name === Sections.CONTRIBUTE);
        if (contributeSectionIdx !== -1) {
          const sectionsToAdd = [Sections.TOP_FINANCIAL_CONTRIBUTORS];
          if (collectiveType === 'COLLECTIVE') {
            sectionsToAdd.unshift(Sections.EVENTS, Sections.CONNECTED_COLLECTIVES);
          }

          remove(convertedSubSections, s => sectionsToAdd.includes(s.name));
          const convertedSubSectionsToAdd = sectionsToAdd.map(name => ({ type: 'SECTION', isEnabled: true, name }));
          convertedSubSections.splice(contributeSectionIdx + 1, 0, ...convertedSubSectionsToAdd);
        }

        // Contributors is replaced by "Our team" for organizations. We can remove it safely
        if (collectiveType === 'ORGANIZATION') {
          const contributorsIdx = convertedSubSections.findIndex(s => s.name === Sections.CONTRIBUTORS);
          if (contributorsIdx !== -1) {
            convertedSubSections.splice(contributorsIdx, 1);
          }
        }
      }

      convertedSections.push({
        type: 'CATEGORY',
        name: category || 'Other',
        sections: convertedSubSections,
        isEnabled: true,
      });
    }
  } while (sectionsToConvert.length > 0);

  return convertedSections;
};

/**
 * Converts sections back to legacy format ([{ section, isEnabled }]), without categories
 */
export const convertSectionsToLegacyFormat = sections => {
  return flatten(
    sections
      .map(e => {
        if (typeof e === 'string') {
          return { section: e, isEnabled: true };
        } else if (e.section) {
          // Already Legacy format
          return e;
        } else if (e.type === 'SECTION') {
          if ([Sections.TOP_FINANCIAL_CONTRIBUTORS].includes(e.name)) {
            // V2 only sections
            return null;
          } else {
            return { section: e.name, isEnabled: e.isEnabled, restrictedTo: e.restrictedTo };
          }
        } else if (e.type === 'CATEGORY' && e.sections) {
          return convertSectionsToLegacyFormat(e.sections);
        }
      })
      .filter(Boolean),
  );
};

/**
 * Return all section names as an array of string
 */
export const getSectionsNames = sections => {
  return flatten(
    sections
      .map(e => {
        if (typeof e === 'string') {
          return e;
        } else if (e.section) {
          return e.section;
        } else if (e.type === 'SECTION') {
          return e.name;
        } else if (e.type === 'CATEGORY' && e.sections) {
          return getSectionsNames(e.sections);
        }
      })
      .filter(Boolean),
  );
};

/**
 * Return the path of the section in `sections`. Works with both legacy & new format.
 * @returns {string|null}
 */
export const getSectionPath = (sections, sectionName) => {
  if (!sections?.length) {
    return null;
  } else if (sections[0].type) {
    // New format
    const categoryName = SECTIONS_CATEGORIES[sectionName];
    if (categoryName) {
      const categoryIdx = sections.findIndex(s => s.type === 'CATEGORY' && s.name === categoryName);
      if (categoryIdx !== -1) {
        const sectionIdx = sections[categoryIdx].sections.findIndex(s => s.name === sectionName);
        if (sectionIdx !== -1) {
          return `${categoryIdx}.sections.${sectionIdx}`;
        }
      }
    } else {
      const idx = sections.findIndex(s => s.name === sectionName);
      if (idx !== -1) {
        return idx.toString();
      }
    }
  } else {
    // Legacy format
    return sections.findIndex(s => (typeof s === 'string' ? s === sectionName : s.section === sectionName));
  }

  return null;
};

export const hasSection = (sections, sectionName) => {
  const path = getSectionPath(sections, sectionName);
  if (path) {
    return get(sections, path).isEnabled;
  } else {
    return false;
  }
};

/**
 * /!\ Only work with new format.
 * Adds the default sections that are not yet defined in `sections`, with `isEnabled` to false.
 * Useful to make sure newly added sections/categories are added on legacy collectives.
 */
export const addDefaultSections = (collective, sections, defaultIsEnabled = true) => {
  const defaultSections = getDefaultSectionsForCollective(collective.type, collective.isActive, true);
  const newSections = cloneDeep(sections);

  defaultSections.forEach(section => {
    const sectionPath = getSectionPath(sections, section);
    if (!sectionPath) {
      const categoryName = getSectionCategory(section);
      if (categoryName) {
        let category = newSections.find(e => e.type === 'CATEGORY' && e.name === categoryName);
        if (!category) {
          category = { type: 'CATEGORY', name: categoryName, sections: [] };
          newSections.push(category);
        }
        category.sections.push({ type: 'SECTION', name: section, isEnabled: defaultIsEnabled });
      } else {
        newSections.push({ type: 'SECTION', name: section, isEnabled: defaultIsEnabled });
      }
    }
  });

  return newSections;
};

const NAV_V2_FEATURE_FLAG = parseToBoolean(getEnvVar('NEW_COLLECTIVE_NAVBAR'));

export const hasNewNavbar = versionFromPath => {
  if (versionFromPath === 'v2') {
    return true;
  } else if (versionFromPath === 'v1') {
    return false;
  } else {
    return NAV_V2_FEATURE_FLAG;
  }
};
