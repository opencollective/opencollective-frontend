/**
 * Shared dimensions between collective page's components
 */
export const Dimensions = {
  PADDING_X: [15, 30],
  MAX_SECTION_WIDTH: 1260,
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
  GOALS: 'goals',
  TICKETS: 'tickets',
  CONTRIBUTIONS: 'contributions',
  CONTRIBUTE: 'contribute',
  // CONVERSATIONS: 'conversations',
  UPDATES: 'updates',
  PARTICIPANTS: 'participants',
  LOCATION: 'location',
  BUDGET: 'budget',
  CONTRIBUTORS: 'contributors',
  TRANSACTIONS: 'transactions',
  ABOUT: 'about',
};

/** A list of all section names */
export const AllSectionsNames = Object.values(Sections);
