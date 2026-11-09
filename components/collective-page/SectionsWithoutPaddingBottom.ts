import { Sections } from './_constants';

/**
 * The following sections don't require a padding bottom when put at the end of the
 * page, usually because they end with a darker background.
 */
const sectionsWithoutPaddingBottom = {
  [Sections.ABOUT]: true,
  [Sections.CONTRIBUTE]: true,
  [Sections.GOALS]: true,
};

export default sectionsWithoutPaddingBottom;
