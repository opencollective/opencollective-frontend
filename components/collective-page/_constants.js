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

export const Sections = {
  TOP_FINANCIAL_CONTRIBUTORS: 'top-financial-contributors',
  CONNECTED_COLLECTIVES: 'connected-collectives',
  OUR_TEAM: 'our-team',
  GOALS: 'goals',
  UPDATES: 'updates',
  CONVERSATIONS: 'conversations',
  RECURRING_CONTRIBUTIONS: 'recurring-contributions',
  TICKETS: 'tickets',
  LOCATION: 'location',
  // Navigation v2 main sections
  // CONTRIBUTE/CONTRIBUTIONS
  CONTRIBUTE: 'contribute',
  CONTRIBUTIONS: 'contributions',
  // EVENTS/PROJECTS
  EVENTS: 'events',
  PROJECTS: 'projects',
  // BUDGET/TRANSACTIONS
  TRANSACTIONS: 'transactions',
  BUDGET: 'budget',
  // CONTRIBUTORS/PARTICIPANTS - is this a stand alone or in BUDGET as per Figma??
  CONTRIBUTORS: 'contributors',
  PARTICIPANTS: 'participants',
  // ABOUT
  ABOUT: 'about',
  // EMPTY for new collectives/no data in any category sections
  EMPTY: 'empty',
  // @deprecated will be removed as they are now considered as "navbar section categories"
  CONNECT: 'connect',
};

/** A list of all section names */
export const AllSectionsNames = Object.values(Sections);
