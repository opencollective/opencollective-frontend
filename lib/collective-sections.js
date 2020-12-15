/**
 * There are 3 levels of filtering to know if a section should appear or not.
 *
 * 1. Status of the collective: the `type`, `isActive`
 * 2. User's permissions: certain sections are displayed only to admins
 * 3. The data: we won't display a section if it's empty
 */

import { cloneDeep, get, remove } from 'lodash';

import { Sections } from '../components/collective-page/_constants';

import { CollectiveType } from './constants/collectives';
import hasFeature, { FEATURES } from './allowed-features';
import { canOrderTicketsFromEvent, isPastEvent } from './events';

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

const DEFAULT_SECTIONS_V2 = {
  [CollectiveType.ORGANIZATION]: [
    Sections.CONTRIBUTE,
    Sections.EVENTS,
    Sections.BUDGET,
    Sections.UPDATES,
    Sections.CONVERSATIONS,
    Sections.ABOUT,
  ],
  [CollectiveType.COLLECTIVE]: [
    Sections.GOALS,
    Sections.CONTRIBUTE,
    Sections.TOP_FINANCIAL_CONTRIBUTORS,
    Sections.EVENTS,
    Sections.BUDGET,
    Sections.UPDATES,
    Sections.CONVERSATIONS,
    Sections.ABOUT,
  ],
  [CollectiveType.USER]: [Sections.CONTRIBUTIONS, Sections.TRANSACTIONS, Sections.ABOUT],
  [CollectiveType.EVENT]: [Sections.ABOUT, Sections.CONTRIBUTE, Sections.BUDGET],
  [CollectiveType.FUND]: [Sections.CONTRIBUTE, Sections.PROJECTS, Sections.BUDGET, Sections.ABOUT],
  [CollectiveType.PROJECT]: [Sections.ABOUT, Sections.CONTRIBUTE, Sections.BUDGET],
};

/**
 * 1. Returns all the sections than can be used for this collective
 */
export const getDefaultSectionsForCollective = (type, isActive, hasNewCollectiveNavbar) => {
  // Layer of compatibility with GQLV2
  const typeKey = type === 'INDIVIDUAL' ? 'USER' : type;
  // TODO: Keeping two versions of `DEFAULT_SECTIONS` is dangerous, we should have only one
  // and implement a migration strategy if we want to make changes to them
  const defaultSections = (hasNewCollectiveNavbar ? DEFAULT_SECTIONS_V2[typeKey] : DEFAULT_SECTIONS[typeKey]) || [];
  const toRemove = new Set();

  // Remove unnecessary sections
  if (type === CollectiveType.ORGANIZATION) {
    if (!isActive) {
      toRemove.add(Sections.CONTRIBUTE);
      toRemove.add(Sections.BUDGET);
    }
  }

  return defaultSections.filter(section => !toRemove.has(section));
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
export const filterSectionsByData = (sections, collective, isAdmin, isHostAdmin, hasNewCollectiveNavbar) => {
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
  if (!isAdmin && !isHostAdmin) {
    const { updates, transactions, balance } = collective.stats || {};
    const expenses = collective.expenses || [];
    if (!updates) {
      toRemove.add(Sections.UPDATES);
    }
    if (!collective.balance && !balance && !(transactions && transactions.all) && !expenses.length) {
      toRemove.add(Sections.BUDGET);
    }
    if (!collective.hasLongDescription && !collective.longDescription) {
      toRemove.add(Sections.ABOUT);
    }
    if (isFund && !collective.projects?.length) {
      toRemove.add(Sections.PROJECTS);
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
  if (!hasNewCollectiveNavbar) {
    toRemove.add(Sections.EVENTS);
  }

  return sections.filter(section => !toRemove.has(section));
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
    }
    if (!hasAccessToFeature(FEATURES.RECURRING_CONTRIBUTIONS)) {
      toRemove.add(Sections.CONTRIBUTE);
    }
    if (!hasAccessToFeature(FEATURES.EVENTS)) {
      toRemove.add(Sections.EVENTS);
    }
    if (!hasAccessToFeature(FEATURES.CONNECTED_ACCOUNTS)) {
      toRemove.add(Sections.CONNECTED_COLLECTIVES);
    }
    if (!collective.hasLongDescription && !collective.longDescription && !isAdmin && !isHostAdmin) {
      toRemove.add(Sections.ABOUT);
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

// Navigation v2
export const filterSectionsByDataV2 = (sections, collective, isAdmin, isHostAdmin) => {
  const toRemove = getSectionsToRemoveForUser(collective, isAdmin, isHostAdmin, true);
  return sections.filter(section => !toRemove.has(section));
};

/**
 * Combine all the previous steps to directly get the sections that should be
 * displayed for the user.
 */
export const getFilteredSectionsForCollective = (collective, isAdmin, isHostAdmin, hasNewCollectiveNavbar) => {
  let sections;
  if (hasNewCollectiveNavbar) {
    if (
      get(collective, 'settings.collectivePage.useNewSections') &&
      get(collective, 'settings.collectivePage.sections')
    ) {
      sections = cloneDeep(get(collective, 'settings.collectivePage.sections'));

      // Filter sections
      const toRemove = getSectionsToRemoveForUser(collective, isAdmin, isHostAdmin, hasNewCollectiveNavbar);
      sections = sections.filter(e => e.type !== 'SECTION' || !toRemove.has(e.name));
      sections.forEach(e => {
        if (e.type === 'CATEGORY') {
          e.sections = e.sections.filter(e => !toRemove.has(e.name));
        }
      });

      // Filter empty categories
      return sections.filter(e => e.type !== 'CATEGORY' || e.sections.length > 0);
    } else {
      sections = getDefaultSectionsForCollective(collective?.type, collective?.isActive);
      sections = filterSectionsByDataV2(sections, collective, isAdmin, isHostAdmin);
      return convertSectionsToNewFormat(sections);
    }
  } else {
    sections =
      get(collective, 'settings.collectivePage.sections') ||
      getDefaultSectionsForCollective(collective?.type, collective?.isActive);
    sections = filterSectionsForUser(sections, isAdmin, isHostAdmin);
    return filterSectionsByData(sections, collective, isAdmin, isHostAdmin, hasNewCollectiveNavbar);
  }
};

export const NAVBAR_CATEGORIES = {
  ABOUT: 'ABOUT',
  BUDGET: 'BUDGET',
  CONNECT: 'CONNECT',
  CONTRIBUTE: 'CONTRIBUTE',
  EVENTS: 'EVENTS', // Events, projects, connected collectives
};

/**
 * Map sections to their categories. Any section that's not in this object will be considered
 * as a "Widget" (aka. a section without navbar category).
 */
const SECTIONS_CATEGORIES = {
  // About
  [Sections.ABOUT]: NAVBAR_CATEGORIES.ABOUT,
  [Sections.LOCATION]: NAVBAR_CATEGORIES.ABOUT,
  // Connect
  [Sections.CONVERSATIONS]: NAVBAR_CATEGORIES.CONNECT,
  [Sections.UPDATES]: NAVBAR_CATEGORIES.CONNECT,
  // Contribute
  [Sections.TICKETS]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.CONTRIBUTE]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.CONTRIBUTORS]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.CONTRIBUTIONS]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.RECURRING_CONTRIBUTIONS]: NAVBAR_CATEGORIES.CONTRIBUTE,
  [Sections.CONTRIBUTORS]: NAVBAR_CATEGORIES.CONTRIBUTE,
  // Budget
  [Sections.BUDGET]: NAVBAR_CATEGORIES.BUDGET,
  // Events/Projects
  [Sections.EVENTS]: NAVBAR_CATEGORIES.EVENTS,
  [Sections.PROJECTS]: NAVBAR_CATEGORIES.EVENTS,
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
export const convertSectionsToNewFormat = sections => {
  const sectionsToConvert = sections.map(normalizeLegacySection);
  const convertedSections = [];

  if (!sectionsToConvert.length) {
    return [];
  }

  do {
    const section = sectionsToConvert[0];

    const category = SECTIONS_CATEGORIES[section.section];
    if (!category) {
      // Simple case: section is a widget (not part of any category)
      convertedSections.push(convertSectionToNewFormat(section));
      sectionsToConvert.shift();
    } else {
      // If part of a category, create it and store all alike sections
      const allCategorySections = remove(sectionsToConvert, s => SECTIONS_CATEGORIES[s.section] === category);
      convertedSections.push({
        type: 'CATEGORY',
        name: category || 'Other',
        sections: allCategorySections.map(convertSectionToNewFormat),
      });
    }
  } while (sectionsToConvert.length > 0);

  return convertedSections;
};

/**
 * Return the path of the section in `sections`. Works with both legacy & new format.
 * @returns {string|null}
 */
export const getSectionPath = (sections, sectionName) => {
  if (sections[0].type) {
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
    return sections.findIndex(s => s.section === sectionName);
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
export const addDefaultSections = (collective, sections) => {
  const defaultSections = getDefaultSectionsForCollective(collective.type, collective.isActive);
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
        category.sections.push({ type: 'SECTION', name: section, isEnabled: false });
      } else {
        newSections.push({ type: 'SECTION', name: section, isEnabled: false });
      }
    }
  });

  return newSections;
};
