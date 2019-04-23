/**
 * Shared dimensions between collective page's components
 */
export const Dimensions = {
  PADDING_X: [15, 30, null, null, 120],
  MAX_SECTION_WIDTH: 1700,
};

/**
 * A map of unique identifiers for the sections of the page
 */
export const Sections = {
  JOIN_US: 'join-us',
  GET_AND_GIVE: 'get-and-give',
  CONVERSATIONS: 'conversations',
  BUDGET: 'budget',
  CONTRIBUTORS: 'contributors',
  ABOUT: 'about',
};

/** A list of all section names */
export const AllSectionsNames = Object.values(Sections);
