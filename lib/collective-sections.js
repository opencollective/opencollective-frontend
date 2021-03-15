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

const RichCollectiveType = {
  ...CollectiveType,
  HOST_ORGANIZATION: 'HOST_ORGANIZATION',
  ACTIVE_HOST_ORGANIZATION: 'ACTIVE_HOST_ORGANIZATION',
};

/**
 * A map of default sections by collective type.
 * Structure: { collectiveType: { sectionName: isDefaultEnabled } }
 */
const DEFAULT_SECTIONS = {
  [CollectiveType.ORGANIZATION]: {
    [Sections.CONTRIBUTIONS]: true,
    [Sections.RECURRING_CONTRIBUTIONS]: true,
    [Sections.CONNECTED_COLLECTIVES]: true,
    [Sections.TRANSACTIONS]: true,
    [Sections.ABOUT]: true,
    [Sections.OUR_TEAM]: true,
  },
  [RichCollectiveType.HOST_ORGANIZATION]: {
    [Sections.CONTRIBUTIONS]: true,
    [Sections.RECURRING_CONTRIBUTIONS]: true,
    [Sections.CONNECTED_COLLECTIVES]: true,
    [Sections.TRANSACTIONS]: true,
    [Sections.UPDATES]: true,
    [Sections.CONVERSATIONS]: true,
    [Sections.ABOUT]: true,
    [Sections.OUR_TEAM]: true,
  },
  [RichCollectiveType.ACTIVE_HOST_ORGANIZATION]: {
    [Sections.CONTRIBUTE]: true,
    [Sections.EVENTS]: true,
    [Sections.CONNECTED_COLLECTIVES]: true,
    [Sections.TOP_FINANCIAL_CONTRIBUTORS]: true,
    [Sections.CONTRIBUTORS]: true,
    [Sections.CONTRIBUTIONS]: true,
    [Sections.RECURRING_CONTRIBUTIONS]: true,
    [Sections.BUDGET]: true,
    [Sections.UPDATES]: true,
    [Sections.CONVERSATIONS]: true,
    [Sections.ABOUT]: true,
    [Sections.OUR_TEAM]: true,
  },
  [CollectiveType.COLLECTIVE]: {
    [Sections.GOALS]: true, // TODO: Should be false, but we must first migrate the checkbox from `components/edit-collective/sections/CollectiveGoals.js`
    [Sections.CONTRIBUTE]: true,
    [Sections.EVENTS]: true,
    [Sections.CONNECTED_COLLECTIVES]: true,
    [Sections.TOP_FINANCIAL_CONTRIBUTORS]: true,
    [Sections.CONTRIBUTORS]: true,
    [Sections.RECURRING_CONTRIBUTIONS]: true,
    [Sections.BUDGET]: true,
    [Sections.UPDATES]: true,
    [Sections.CONVERSATIONS]: true,
    [Sections.ABOUT]: true,
    [Sections.OUR_TEAM]: true,
  },
  [CollectiveType.USER]: {
    [Sections.CONTRIBUTIONS]: true,
    [Sections.RECURRING_CONTRIBUTIONS]: true,
    [Sections.TRANSACTIONS]: true,
    [Sections.ABOUT]: true,
  },
  [CollectiveType.EVENT]: {
    [Sections.CONTRIBUTE]: true,
    [Sections.PARTICIPANTS]: true,
    [Sections.ABOUT]: true,
    [Sections.LOCATION]: true,
    [Sections.OUR_TEAM]: true,
    [Sections.BUDGET]: true,
  },
  [CollectiveType.FUND]: {
    [Sections.CONTRIBUTE]: true,
    [Sections.RECURRING_CONTRIBUTIONS]: true,
    [Sections.CONTRIBUTORS]: true,
    [Sections.TOP_FINANCIAL_CONTRIBUTORS]: true,
    [Sections.PROJECTS]: true,
    [Sections.UPDATES]: false,
    [Sections.BUDGET]: true,
    [Sections.ABOUT]: true,
    [Sections.OUR_TEAM]: true,
  },
  [CollectiveType.PROJECT]: {
    [Sections.ABOUT]: true,
    [Sections.OUR_TEAM]: true,
    [Sections.CONTRIBUTE]: true,
    [Sections.CONTRIBUTORS]: true,
    [Sections.BUDGET]: true,
    [Sections.UPDATES]: false,
  },
};

const getCollectiveTypeKey = (type, isHost, isActive) => {
  if (type === 'INDIVIDUAL') {
    // Layer of compatibility with GQLV2
    return CollectiveType.USER;
  } else if (type === 'ORGANIZATION' && isHost) {
    return isActive ? RichCollectiveType.ACTIVE_HOST_ORGANIZATION : RichCollectiveType.HOST_ORGANIZATION;
  }

  return type;
};

/**
 * Returns all the sections than can be used for this collective type
 */
const getDefaultSectionsForCollectiveType = (type, isHost, isActive) => {
  const typeKey = getCollectiveTypeKey(type, isHost, isActive);
  return DEFAULT_SECTIONS[typeKey] || [];
};

const filterSectionsByData = (sections, collective, isAdmin, isHostAdmin) => {
  const toRemove = getSectionsToRemoveForUser(collective, isAdmin);
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

const showContributeSection = (collective, isAdmin) => {
  const status = collective?.features?.[FEATURES.RECEIVE_FINANCIAL_CONTRIBUTIONS];
  switch (status) {
    case 'ACTIVE':
    case 'AVAILABLE':
      return true;
    case 'DISABLED':
      return collective.type === CollectiveType.COLLECTIVE && isAdmin;
    default:
      return false;
  }
};

const getSectionsToRemoveForUser = (collective, isAdmin) => {
  const toRemove = new Set();
  collective = collective || {};
  const features = collective.features || {};

  const hasAccessToFeature = feature => {
    const status = features[feature];
    return status === 'ACTIVE' || (status === 'AVAILABLE' && isAdmin);
  };

  if (!showContributeSection(collective, isAdmin)) {
    toRemove.add(Sections.CONTRIBUTE);
    toRemove.add(Sections.TOP_FINANCIAL_CONTRIBUTORS);
  }
  if (features[FEATURES.RECEIVE_FINANCIAL_CONTRIBUTIONS] !== 'ACTIVE') {
    toRemove.add(Sections.PARTICIPANTS);
  }
  if (!hasAccessToFeature(FEATURES.PROJECTS)) {
    toRemove.add(Sections.PROJECTS);
  }
  if (!hasAccessToFeature(FEATURES.COLLECTIVE_GOALS)) {
    toRemove.add(Sections.GOALS);
  }
  if (features[FEATURES.RECURRING_CONTRIBUTIONS] !== 'ACTIVE') {
    toRemove.add(Sections.RECURRING_CONTRIBUTIONS);
  }
  if (features[FEATURES.TRANSACTIONS] !== 'ACTIVE') {
    toRemove.add(Sections.TRANSACTIONS);
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
  if (features[FEATURES.CONNECTED_ACCOUNTS] !== 'ACTIVE') {
    // If there's no connected accounts, there's no benefit in enabling the section as it will return null anyway
    toRemove.add(Sections.CONNECTED_COLLECTIVES);
  }
  if (!collective.hasLongDescription && !collective.longDescription && !isAdmin) {
    toRemove.add(Sections.ABOUT);
  }
  if (!collective.memberOf?.length) {
    toRemove.add(Sections.CONTRIBUTIONS);
  }
  if (isEmptyCollectiveLocation(collective)) {
    toRemove.add(Sections.LOCATION);
  }

  return toRemove;
};

/**
 * Loads collective's sections from settings, adding the default sections to them
 */
export const getCollectiveSections = collective => {
  const sections = get(collective, 'settings.collectivePage.sections');
  return addDefaultSections(collective, sections || []);
};

/**
 * Combine all the previous steps to directly get the sections that should be
 * displayed for the user.
 */
export const getFilteredSectionsForCollective = (collective, isAdmin, isHostAdmin) => {
  const sections = getCollectiveSections(collective);
  return filterSectionsByData(sections, collective, isAdmin, isHostAdmin);
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

export const isSectionEnabled = (sections, sectionName, isAdmin) => {
  const path = getSectionPath(sections, sectionName);
  if (path) {
    const section = get(sections, path);
    return section.isEnabled || (isAdmin && section.restrictedTo?.includes('ADMIN'));
  } else {
    return false;
  }
};

export const isSectionForAdminsOnly = (collective, sectionName) => {
  const sections = getCollectiveSections(collective);
  const path = getSectionPath(sections, sectionName);
  if (path) {
    return Boolean(get(sections, path).restrictedTo?.includes('ADMIN'));
  } else {
    return false;
  }
};

/**
 * Adds the default sections that are not yet defined in `sections`, with `isEnabled` to false.
 * Useful to make sure newly added sections/categories are added on legacy collectives.
 */
export const addDefaultSections = (collective, sections) => {
  if (!collective) {
    return [];
  }

  const newSections = cloneDeep(sections || []);
  const defaultSections = getDefaultSectionsForCollectiveType(collective.type, collective.isHost, collective.isActive);

  Object.entries(defaultSections).forEach(([section, defaultIsEnabled]) => {
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
