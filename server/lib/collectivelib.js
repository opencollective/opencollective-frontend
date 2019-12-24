import { pick } from 'lodash';
import config from 'config';
import * as LibTaxes from '@opencollective/taxes';
import { VAT_OPTIONS } from '../constants/vat';
import { md5 } from './utils';
import { types as CollectiveTypes } from '../constants/collectives';

/**
 * Returns an URL for the given collective params
 * @param {String} collectiveSlug
 * @param {String} collectiveType
 * @param {String|null} image
 * @param {Object} args
 *    - height
 *    - format
 */
export const getCollectiveAvatarUrl = (collectiveSlug, collectiveType, image, args) => {
  const sections = [config.host.images, collectiveSlug];

  if (image) {
    sections.push(md5(image).substring(0, 7));
  }

  sections.push(collectiveType === CollectiveTypes.USER ? 'avatar' : 'logo');

  if (args.height) {
    sections.push(args.height);
  }

  return `${sections.join('/')}.${args.format || 'png'}`;
};

/**
 * Whitelist the collective settings that can be updated.
 * TODO: Whitelist all collective fields (only VAT is atm)
 */
export function whitelistSettings(settings) {
  if (!settings) {
    return null;
  }

  const preparedSettings = { ...settings };

  if (preparedSettings.VAT) {
    preparedSettings.VAT = pick(preparedSettings.VAT, ['number', 'type']);
  }

  return preparedSettings;
}

/**
 * Returns false if settings are valid or an error as string otherwise
 * @param {object|null} settings
 */
export function validateSettings(settings) {
  if (!settings) {
    return false;
  }

  // Validate VAT
  if (settings.VAT) {
    if (typeof settings.VAT !== 'object') {
      return 'Invalid type for VAT settings';
    } else if (settings.VAT.number && !LibTaxes.checkVATNumberFormat(settings.VAT.number).isValid) {
      return 'Invalid VAT number';
    } else if (settings.VAT.type && settings.VAT.type !== VAT_OPTIONS.HOST && settings.VAT.type !== VAT_OPTIONS.OWN) {
      return 'Invalid VAT configuration';
    }
  }

  if (settings) {
    return false;
  }
}

export const collectiveSlugBlacklist = [
  'about',
  'admin',
  'applications',
  'become-a-sponsor',
  'chapters',
  'collective',
  'collectives',
  'contact',
  'contribute',
  'create',
  'create-account',
  'confirm',
  'delete',
  'deleteCollective',
  'discover',
  'donate',
  'edit',
  'expenses',
  'event',
  'events',
  'faq',
  'gift-card',
  'gift-cards',
  'gift-cards-next',
  'gift-of-giving',
  'help',
  'home',
  'host',
  'hosts',
  'how-it-works',
  'join',
  'join-free',
  'learn-more',
  'member-invitations',
  'member',
  'members',
  'order',
  'orders',
  'pledge',
  'pledges',
  'pricing',
  'privacypolicy',
  'redeem',
  'redeemed',
  'register',
  'search',
  'signin',
  'signup',
  'subscriptions',
  'tos',
  'transactions',
  'widgets',
];

/**
 * Check if given `slug` could conflict with existing routes or
 * if it's a reserved keyword.
 *
 * The list is mostly based on frontend `src/server/pages.js` file and
 * `src/pages/static` content.
 *
 * @param {String} slug
 */
export function isBlacklistedCollectiveSlug(slug) {
  return collectiveSlugBlacklist.includes(slug);
}
