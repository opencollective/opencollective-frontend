/**
 * Shared dimensions between collective page's components
 */
export const Dimensions = {
  PADDING_X: [15, 30],
  MAX_SECTION_WIDTH: 1200,
};

/**
 * Durations for page animations
 */
export const AnimationsDurations = {
  HERO_COLLAPSE: 150,
};

/**
 * A map of unique identifiers for the sections of the page
 */
export const Sections = {
  COLLECTIVES: 'collectives',
  CONTRIBUTE: 'contribute',
  // CONVERSATIONS: 'conversations',
  UPDATES: 'updates',
  BUDGET: 'budget',
  CONTRIBUTORS: 'contributors',
  TRANSACTIONS: 'transactions',
  ABOUT: 'about',
};

/** A list of all section names */
export const AllSectionsNames = Object.values(Sections);

/** Defines contributions types */
export const ContributionTypes = {
  FINANCIAL_CUSTOM: 'FINANCIAL_CUSTOM',
  FINANCIAL_ONE_TIME: 'FINANCIAL_ONE_TIME',
  FINANCIAL_RECURRING: 'FINANCIAL_RECURRING',
  FINANCIAL_GOAL: 'FINANCIAL_GOAL',
  EVENT_PARTICIPATE: 'EVENT_PARTICIPATE',
};

/** Max number of contributors on each tier card */
export const MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD = 4;
