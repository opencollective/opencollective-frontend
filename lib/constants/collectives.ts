import { invert, omit } from 'lodash';

import { AccountType } from '../graphql/types/v2/schema';

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
} as const;

export const HostedCollectiveTypes = omit(CollectiveType, ['USER', 'INDIVIDUAL', 'ORGANIZATION', 'BOT', 'VENDOR']);

export const AccountTypesWithHost = [
  AccountType.COLLECTIVE,
  AccountType.EVENT,
  AccountType.FUND,
  AccountType.PROJECT,
] as const;

export const defaultBackgroundImage = {
  COLLECTIVE: '/static/images/defaultBackgroundImageCollective.jpg',
  EVENT: '/static/images/defaultBackgroundImage.png',
  ORGANIZATION: '/static/images/defaultBackgroundImage.png',
  USER: '/static/images/defaultBackgroundImage.png',
} as const;

export const defaultImage = {
  ORGANIZATION: '/static/images/default-organization-logo.svg',
  COLLECTIVE: '/static/images/default-collective-logo.svg',
  CHAPTER: '/static/images/default-chapter-logo.svg',
  ANONYMOUS: '/static/images/default-anonymous-logo.svg',
  GUEST: '/static/images/default-guest-logo.svg',
} as const;

/** The ID of the open source collective */
export const OPENSOURCE_COLLECTIVE_ID = ['staging', 'production'].includes(process.env.OC_ENV) ? 11004 : 9805;

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
} as const;

/** Map additional tags to categories */
export const CollectiveTagsCategories = invert(CollectiveCategory);

export const AVATAR_WIDTH_RANGE = [200, 3000] as const;
export const AVATAR_HEIGHT_RANGE = [200, 3000] as const;
export const IGNORED_TAGS = ['community', 'user'] as const;
