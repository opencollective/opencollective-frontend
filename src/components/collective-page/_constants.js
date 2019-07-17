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
  CONTRIBUTE: 'contribute',
  // CONVERSATIONS: 'conversations',
  UPDATES: 'updates',
  BUDGET: 'budget',
  CONTRIBUTORS: 'contributors',
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

/** Default primary colors for collectives */
export const DEFAULT_PRIMARY_COLOR = '#000000';
