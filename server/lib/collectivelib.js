import { pick } from 'lodash';
import * as LibTaxes from '@opencollective/taxes';
import { VAT_OPTIONS } from '../constants/vat';

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
