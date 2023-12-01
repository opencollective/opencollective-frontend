import { get, isNil, min, orderBy, uniq } from 'lodash';

import { CollectiveType } from './constants/collectives';
import INTERVALS from './constants/intervals';
import { AmountTypes, TierTypes } from './constants/tiers-types';

export const TIERS_ORDER_KEY = 'collectivePage.tiersOrder';
export const DEFAULT_PRESETS = [500, 1000, 2000, 5000];
export const DEFAULT_FUNDS_PRESETS = [100000, 200000, 500000, 1000000];
export const DEFAULT_MINIMUM_AMOUNT = 100;

/**
 * Generated from the following query, using rounded number to make sure we don't suggest odd amounts.
 *
 * ```sql
 * WITH uniq_currencies AS (
 *     SELECT DISTINCT "to"
 *     FROM "CurrencyExchangeRates"
 *     WHERE "from" = 'USD'
 * ) SELECT uc."to", (
 *     -- Keep only first digit from number (e.g. 4 -> 4, 89 -> 80, 1337 -> 1000)
 *     SELECT LEFT(rate::TEXT, 1)::integer * POW(10, LENGTH(CAST(ROUND(rate) AS TEXT)) - 1)
 *     FROM "CurrencyExchangeRates" e WHERE e.from = 'USD' AND e.to = uc.to ORDER BY e."createdAt" DESC LIMIT 1
 *   ) AS rate
 * FROM uniq_currencies uc
 * ORDER BY rate DESC
 * ```
 */
const CURRENCY_ADJUSTMENT_RATES = {
  STD: 20000,
  VND: 20000,
  LAK: 10000,
  IDR: 10000,
  SLL: 10000,
  UZS: 10000,
  GNF: 8000,
  PYG: 6000,
  KHR: 4000,
  MGA: 4000,
  UGX: 3000,
  COP: 3000,
  MNT: 3000,
  TZS: 2000,
  CDF: 2000,
  BIF: 2000,
  MWK: 1000,
  KRW: 1000,
  LBP: 1000,
  MMK: 1000,
  RWF: 1000,
  CLP: 800,
  XAF: 600,
  XOF: 600,
  CRC: 600,
  SOS: 500,
  KZT: 400,
  KMF: 400,
  AMD: 400,
  NGN: 400,
  AOA: 400,
  HUF: 300,
  LKR: 300,
  MRO: 300,
  GYD: 200,
  PKR: 200,
  YER: 200,
  DJF: 100,
  JPY: 100,
  RSD: 100,
  KES: 100,
  XPF: 100,
  NPR: 100,
  ALL: 100,
  HTG: 100,
  VUV: 100,
  ISK: 100,
  JMD: 100,
  LRD: 100,
  CVE: 100,
  DZD: 100,
  ARS: 100,
  BDT: 90,
  SEK: 90,
  MAD: 90,
  AFN: 80,
  KGS: 70,
  INR: 70,
  RUB: 60,
  MZN: 60,
  PHP: 50,
  GMD: 50,
  DOP: 50,
  MKD: 50,
  ETB: 50,
  UYU: 40,
  MUR: 40,
  NIO: 30,
  THB: 30,
  HNL: 20,
  TWD: 20,
  CZK: 20,
  UAH: 20,
  SRD: 20,
  LSL: 10,
  ZAR: 10,
  SZL: 10,
  MVR: 10,
  ZMW: 10,
  NAD: 10,
  EGP: 10,
  MDL: 10,
  TJS: 10,
  MXN: 10,
  SCR: 10,
  TRY: 10,
  BWP: 10,
  NOK: 9,
  MOP: 8,
  SBD: 8,
  HKD: 7,
  HRK: 7,
  GTQ: 7,
  TTD: 6,
  CNY: 6,
  BOB: 6,
  DKK: 6,
  RON: 4,
  BRL: 4,
  MYR: 4,
  PLN: 4,
  PEN: 3,
  PGK: 3,
  SAR: 3,
  BYN: 3,
  AED: 3,
  ILS: 3,
  QAR: 3,
  BBD: 2,
  TOP: 2,
  FJD: 2,
  GEL: 2,
  BZD: 2,
  XCD: 2,
  WST: 2,
};

/**
 * Get the min authorized amount for order, in cents.
 * ⚠️ Only work with data from GQLV2.
 */
export const getTierMinAmount = (tier, currency) => {
  const rate = CURRENCY_ADJUSTMENT_RATES[currency] || 1;
  if (!tier) {
    // When making a donation, min amount is $1
    return DEFAULT_MINIMUM_AMOUNT * rate;
  } else if (tier.amountType === AmountTypes.FIXED) {
    return tier.amount?.valueInCents || 0;
  } else if (tier.minimumAmount.valueInCents !== null) {
    return tier.minimumAmount.valueInCents;
  } else if (tier.presets?.length && min(tier.presets) === 0) {
    return 0;
  } else {
    return DEFAULT_MINIMUM_AMOUNT * rate;
  }
};

const adaptPresetsForCurrency = (presets, currency) => {
  const rate = CURRENCY_ADJUSTMENT_RATES[currency];
  return !rate ? presets : presets.map(amount => Math.round(amount * rate));
};

/**
 * Get the presets for a given tier, or the default presets
 * ⚠️ Only work with data from GQLV2.
 */
export const getTierPresets = (tier, collectiveType, currency) => {
  if (tier?.presets?.length > 0) {
    return tier.presets;
  } else if (collectiveType === CollectiveType.FUND) {
    return adaptPresetsForCurrency(DEFAULT_FUNDS_PRESETS, currency);
  } else if (!tier) {
    return adaptPresetsForCurrency(DEFAULT_PRESETS, currency);
  }

  const minAmount = getTierMinAmount(tier, currency);
  if (minAmount === 0) {
    return [0, 500, 1500, 5000];
  } else if (minAmount < 1000) {
    return [minAmount, 1000, 2500, 5000];
  } else {
    const roundAmount = amount => {
      const amountSize = amount.toString().length;
      const roundingFactor = Math.pow(10, amountSize - 1);
      return Math.round(Math.round(amount / roundingFactor) * roundingFactor);
    };
    return uniq([minAmount, roundAmount(minAmount * 2), roundAmount(minAmount * 3), roundAmount(minAmount * 5)]);
  }
};

/**
 * Returns the default selected amount from a tier.
 * ⚠️ Only work with data from GQLV2.
 */
export const getDefaultTierAmount = (tier, collective, currency) => {
  if (tier && !isNil(tier.amount?.valueInCents)) {
    return tier.amount.valueInCents;
  } else if (getTierMinAmount(tier, currency) === 0) {
    // Free tiers are free per default, even when user can make a donation
    return 0;
  } else {
    const presets = getTierPresets(tier, collective.type, currency);
    return presets[Math.floor(presets.length / 2)];
  }
};

/** Returns true if the price and interval of the current contribution cannot be changed */
export const isFixedContribution = tier => {
  const forceInterval = Boolean(tier);
  const forceAmount = tier && tier.amountType === AmountTypes.FIXED;
  const isFlexible = tier && tier.amountType === AmountTypes.FLEXIBLE;
  return !isFlexible && forceInterval && forceAmount;
};

export const isTierExpired = tier => {
  return tier?.endsAt && new Date(tier.endsAt) < new Date();
};

export const getCollectiveContributionCardsOrder = collective => {
  return get(collective.settings, TIERS_ORDER_KEY, []);
};

export const sortTiers = (baseTiers, orderKeys, hasCustomContribution, hasCryptoContribution) => {
  const tiers = baseTiers.filter(tier => tier.type !== TierTypes.TICKET);
  if (hasCustomContribution) {
    tiers.push('custom');
  }
  if (hasCryptoContribution) {
    tiers.push('crypto');
  }

  return orderBy(tiers, tier => {
    const itemKey = tier === 'custom' ? tier : tier.id;
    const index = orderKeys.findIndex(key => key === itemKey);
    return index === -1 ? Infinity : index; // put unsorted tiers at the end
  });
};

export const sortTiersForCollective = (collective, baseTiers) => {
  const orderKeys = getCollectiveContributionCardsOrder(collective);
  const hasCustomContribution = !get(collective, 'settings.disableCustomContributions', false);
  const hasCryptoContribution = !get(collective, 'settings.disableCryptoContributions', true);
  return sortTiers(baseTiers, orderKeys, hasCustomContribution, hasCryptoContribution);
};

export const getDefaultInterval = tier => {
  if (!tier?.interval) {
    return INTERVALS.oneTime;
  } else if (tier.interval === INTERVALS.flexible) {
    return INTERVALS.month;
  } else {
    return tier.interval;
  }
};
