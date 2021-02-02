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

import { cloneDeep, flatten, get } from 'lodash';

import { Sections } from '../components/collective-page/_constants';

import { CollectiveType } from './constants/collectives';
import { FEATURES } from './allowed-features';
import { isEmptyCollectiveLocation } from './collective.lib';
import { isPastEvent } from './events';

const DEFAULT_SECTIONS = {
  [CollectiveType.ORGANIZATION]: [
    Sections.CONTRIBUTE,
    Sections.CONNECTED_COLLECTIVES,
    Sections.CONTRIBUTIONS,
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
    Sections.CONTRIBUTE,
    Sections.PARTICIPANTS,
    Sections.ABOUT,
    Sections.OUR_TEAM,
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
 * Returns all the sections than can be used for this collective type
 */
const getDefaultSectionsForCollectiveType = (type, isActive) => {
  // Layer of compatibility with GQLV2
  const typeKey = type === 'INDIVIDUAL' ? 'USER' : type;

  // and implement a migration strategy if we want to make changes to them
  const defaultSections = DEFAULT_SECTIONS[typeKey] || [];

  if (type === CollectiveType.ORGANIZATION && !isActive) {
    return defaultSections.filter(
      s => ![Sections.CONTRIBUTE, Sections.BUDGET, Sections.TOP_FINANCIAL_CONTRIBUTORS, Sections.EVENTS].includes(s),
    );
  } else {
    return defaultSections;
  }
};

const filterSectionsByData = (sections, collective, isAdmin, isHostAdmin) => {
  const toRemove = getSectionsToRemoveForUser(collective, isAdmin, isHostAdmin, true);
  const checkSectionActive = section => {
    if (toRemove.has(section.name) || !section.isEnabled) {
      return false;
    } else if (section.restrictedTo?.includes('ADMIN')) {
      return isAdmin || isHostAdmin;
    } else {
      return true;
    }
  };

  sections = sections.filter(e => e.type !== 'SECTION' || checkSectionActive(e));
  sections.forEach(e => {
    if (e.type === 'CATEGORY') {
      e.sections = e.sections.filter(checkSectionActive);
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
export const getFilteredSectionsForCollective = (collective, isAdmin, isHostAdmin) => {
  let sections = get(collective, 'settings.collectivePage.sections');
  if (!sections) {
    sections = addDefaultSections(collective, [], true);
  }

  return filterSectionsByData(cloneDeep(sections), collective, isAdmin, isHostAdmin);
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
  [Sections.TRANSACTIONS]: NAVBAR_CATEGORIES.BUDGET,
};

export const getSectionCategory = sectionName => {
  return SECTIONS_CATEGORIES[sectionName];
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
  } else {
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
  if (!collective) {
    return [];
  }

  const newSections = cloneDeep(sections || []);
  const defaultSections = getDefaultSectionsForCollectiveType(collective.type, collective.isActive, true);

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
