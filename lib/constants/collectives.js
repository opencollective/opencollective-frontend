import { invert } from 'lodash';

export const CollectiveType = {
  COLLECTIVE: 'COLLECTIVE',
  EVENT: 'EVENT',
  USER: 'USER',
  ORGANIZATION: 'ORGANIZATION',
  BOT: 'BOT',
};

export const defaultBackgroundImage = {
  COLLECTIVE: '/static/images/defaultBackgroundImageCollective.jpg',
  EVENT: '/static/images/defaultBackgroundImage.png',
  ORGANIZATION: '/static/images/defaultBackgroundImage.png',
  USER: '/static/images/defaultBackgroundImage.png',
};

export const defaultImage = {
  ORGANIZATION: '/static/images/default-organization-logo.svg',
  COLLECTIVE: '/static/images/default-collective-logo.svg',
  CHAPTER: '/static/images/default-chapter-logo.svg',
  ANONYMOUS: '/static/images/default-anonymous-logo.svg',
  PLEDGED: '/static/images/default-pledged-logo.svg',
};

/** The ID of the open source collective */
export const OPENSOURCE_COLLECTIVE_ID = ['staging', 'production'].includes(process.env.NODE_ENV) ? 11004 : 9805;

/**
 * Map categories to their main tag.
 * Tags are translated in `components/I18nCollectiveTags.js`.
 */
export const CollectiveCategory = {
  ASSOCIATION: 'association',
  COLLECTIVE: 'collective',
  CONFERENCE: 'conference',
  COOPERATIVE: 'coop',
  OPEN_SOURCE: 'open source',
  MEDIA: 'media',
  MEETUP: 'Meetup',
  MOVEMENT: 'movement',
  POLITICS: 'politics',
  TECH_MEETUP: 'Tech meetups',
  US_NONPROFIT: '501c3',
  EVENT: 'event',
  USER: 'user',
  ORGANIZATION: 'organization',
  FUND: 'FUND',
};

/** Map additional tags to categories */
export const CollectiveTagsCategories = invert(CollectiveCategory);
