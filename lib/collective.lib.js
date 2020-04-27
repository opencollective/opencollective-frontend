import {
  CollectiveCategory,
  CollectiveTagsCategories,
  CollectiveType,
  OPENSOURCE_COLLECTIVE_ID,
} from '../lib/constants/collectives';

const image1 = '/static/images/avatar-01.svg';
const image2 = '/static/images/avatar-02.svg';
const image3 = '/static/images/avatar-03.svg';
const image4 = '/static/images/avatar-04.svg';

const avatars = [image1, image2, image3, image4];

export function pickAvatar(NameOrId) {
  return pickRandomImage(avatars, NameOrId);
}

export function pickRandomImage(images, NameOrId = 0) {
  let number = 0;
  if (isNaN(NameOrId)) {
    for (let i = 0; i < NameOrId.length; i++) {
      number += NameOrId.charCodeAt(i);
    }
  } else {
    number = NameOrId;
  }
  return images[number % 4];
}

/**
 * For a given host and/or a list of tags, returns the main tag for the category of the
 * collective. If none matches, defaults to `CollectiveCategory.COLLECTIVE`
 */
export const getCollectiveMainTag = (hostCollectiveId = null, tags = [], type) => {
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
  }

  // Default to 'Collective'
  return CollectiveCategory.COLLECTIVE;
};
