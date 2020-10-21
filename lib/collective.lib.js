import { get, trim } from 'lodash';
import slugify from 'slugify';

import {
  CollectiveCategory,
  CollectiveTagsCategories,
  CollectiveType,
  OPENSOURCE_COLLECTIVE_ID,
} from '../lib/constants/collectives';

/**
 * For a given host and/or a list of tags, returns the main tag for the category of the
 * collective. If none matches, defaults to `CollectiveCategory.COLLECTIVE`
 */
export const getCollectiveMainTag = (hostCollectiveId = null, tags = [], type, settings = null) => {
  // All collectives from "Open Source Collective 501c3" are set to "Open source" category
  if (hostCollectiveId === OPENSOURCE_COLLECTIVE_ID) {
    return CollectiveCategory.OPEN_SOURCE;
  }

  // Try to guess the main category from tags
  if (tags) {
    const tagWithCategory = tags.find(tag => CollectiveTagsCategories[tag]);
    if (tagWithCategory) {
      const category = CollectiveTagsCategories[tagWithCategory];
      return CollectiveCategory[category];
    }
  }

  // Try to get from the type
  if (type === CollectiveType.EVENT) {
    return CollectiveCategory.EVENT;
  } else if (type === CollectiveType.ORGANIZATION) {
    return CollectiveCategory.ORGANIZATION;
  } else if (type === CollectiveType.USER) {
    return CollectiveCategory.USER;
  } else if (type === CollectiveType.PROJECT) {
    return CollectiveCategory.PROJECT;
  } else if (type === CollectiveType.FUND) {
    return CollectiveCategory.FUND;
  }

  // Funds MVP, to refactor
  if (settings && settings.fund) {
    return CollectiveCategory.FUND;
  }

  // Default to 'Collective'
  return CollectiveCategory.COLLECTIVE;
};

export const getCollectiveTypeForUrl = collective => {
  if (!collective) {
    return;
  }

  if (collective.type === 'EVENT') {
    return 'events';
  }
  if (collective.type === 'PROJECT') {
    return 'projects';
  }
};

export const hostIsTaxDeductibeInTheUs = host => {
  return get(host, 'settings.taxDeductibleDonations');
};

export const suggestSlug = value => {
  const slugOptions = {
    replacement: '-',
    lower: true,
    strict: true,
  };

  return trim(slugify(value, slugOptions), '-');
};
