/**
 * Makes use of but doesn't necessarily match opencollective-api/server/lib/allowed-features.ts
 */

import { get } from 'lodash';

import { CollectiveType } from './constants/collectives';

export const FEATURES = {
  // Collective page features
  // Please refer to and update https://docs.google.com/spreadsheets/d/15ppKaZJCXBjvY7-AjjCj3w5D-4ebLQdEowynJksgDXE/edit#gid=0
  RECEIVE_FINANCIAL_CONTRIBUTIONS: 'RECEIVE_FINANCIAL_CONTRIBUTIONS',
  RECURRING_CONTRIBUTIONS: 'RECURRING_CONTRIBUTIONS',
  EVENTS: 'EVENTS',
  PROJECTS: 'PROJECTS',
  USE_EXPENSES: 'USE_EXPENSES',
  RECEIVE_EXPENSES: 'RECEIVE_EXPENSES',
  COLLECTIVE_GOALS: 'COLLECTIVE_GOALS',
  TOP_FINANCIAL_CONTRIBUTORS: 'TOP_FINANCIAL_CONTRIBUTORS',
  CONVERSATIONS: 'CONVERSATIONS',
  UPDATES: 'UPDATES',
  TEAM: 'TEAM',
  // Other
  TRANSFERWISE: 'TRANSFERWISE',
  PAYPAL_DONATIONS: 'PAYPAL_DONATIONS',
  PAYPAL_PAYOUTS: 'PAYPAL_PAYOUTS',
  // Not implemented in API features endpoint yet
  REJECT_CONTRIBUTION: 'REJECT_CONTRIBUTION',
  MODERATION: 'MODERATION',
  SUBMIT_EXPENSE_ON_BEHALF: 'SUBMIT_EXPENSE_ON_BEHALF',
};

/**
 * A map of paths to retrieve the value of a feature flag from a collective's settings.
 * 2020-11-19: deprecating: please use collective.features from now on! add it to your
 * page's GraphQL query if needed.
 */
export const FEATURE_FLAGS = {
  // note: need to add collective.features to expenses query for PayExpenseModal
  [FEATURES.PAYPAL_PAYOUTS]: 'settings.features.paypalPayouts',
  [FEATURES.PAYPAL_DONATIONS]: 'settings.features.paypalDonations',
  // collective page features
  [FEATURES.CONVERSATIONS]: 'settings.features.conversations',
  [FEATURES.COLLECTIVE_GOALS]: 'settings.collectivePage.showGoals',
  [FEATURES.UPDATES]: 'settings.features.updates',
  // other features
  [FEATURES.REJECT_CONTRIBUTION]: 'settings.features.rejectContribution',
  [FEATURES.MODERATION]: 'settings.features.moderation',
  [FEATURES.SUBMIT_EXPENSE_ON_BEHALF]: 'settings.features.submitExpenseOnBehalf',
};

/**
 * Returns true if feature is allowed for this collective type, false otherwise.
 */
export const isFeatureAllowedForCollective = (collective, feature) => {
  // specific condition until we can include collective.features in pages:
  // create-expense.js, expenses-legacy.js, expenses.js
  if (feature === FEATURES.RECEIVE_EXPENSES) {
    return [CollectiveType.COLLECTIVE, CollectiveType.EVENT, CollectiveType.FUND, CollectiveType.PROJECT].includes(
      collective.type,
    );
  }
  const features = collective?.features;
  return features[feature] !== 'UNSUPPORTED';
};

/**
 * Check if the given feature is activated for collective.
 */
const hasFeature = (collective, feature) => {
  if (!collective) {
    return false;
  }

  // *** Important: opt-in/opt-out checks need to be in front of features endpoint checks until we
  // *** fully migrate to the features API endpoint and make sure every case is accounted for.
  // Check opt-out flags
  if (feature === FEATURES.UPDATES && collective.type === CollectiveType.COLLECTIVE) {
    return Boolean(get(collective, FEATURE_FLAGS[FEATURES.UPDATES], true));
  }

  // Check opt-in flags - to be removed when all features using features endpoint?
  const activationFlag = FEATURE_FLAGS[feature];
  if (activationFlag) {
    return Boolean(get(collective, activationFlag, false));
  }

  if (collective.features) {
    const featureStatus = collective.features[feature];

    if (featureStatus === 'ACTIVE' || featureStatus === 'AVAILABLE') {
      return true;
    }

    if (featureStatus === 'DISABLED' || featureStatus === 'UNSUPPORTED') {
      return false;
    }
  }

  return true;
};

export default hasFeature;
