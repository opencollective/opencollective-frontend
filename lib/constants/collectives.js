import { invert, omit } from 'lodash';

export const CollectiveType = {
  COLLECTIVE: 'COLLECTIVE',
  EVENT: 'EVENT',
  USER: 'USER', // GraphQL v1
  INDIVIDUAL: 'INDIVIDUAL', // GraphQL v2
  ORGANIZATION: 'ORGANIZATION',
  BOT: 'BOT',
  PROJECT: 'PROJECT',
  FUND: 'FUND',
  VENDOR: 'VENDOR',
};

export const HostedCollectiveTypes = omit(CollectiveType, ['USER', 'INDIVIDUAL', 'ORGANIZATION', 'BOT', 'VENDOR']);

export const AccountTypesWithHost = [
  CollectiveType.COLLECTIVE,
  CollectiveType.EVENT,
  CollectiveType.FUND,
  CollectiveType.PROJECT,
];

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
  GUEST: '/static/images/default-guest-logo.svg',
};

/** The ID of the open source collective */
export const OPENSOURCE_COLLECTIVE_ID = ['staging', 'production'].includes(process.env.OC_ENV) ? 11004 : 9805;

/** The ID of the open collective foundation */
export const OPENCOLLECTIVE_FOUNDATION_ID = ['staging', 'production'].includes(process.env.OC_ENV) ? 11049 : 10894;

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
  PROJECT: 'project',
};

/** Map additional tags to categories */
export const CollectiveTagsCategories = invert(CollectiveCategory);

export const AVATAR_WIDTH_RANGE = [200, 3000];
export const AVATAR_HEIGHT_RANGE = [200, 3000];
export const IGNORED_TAGS = ['community', 'user'];
