/**
 * Matches opencollective-api/server/lib/allowed-features.ts
 */

import { get } from 'lodash';
import { CollectiveType } from './constants/collectives';

export const FEATURES = {
  CONVERSATIONS: 'CONVERSATIONS',
  COLLECTIVE_GOALS: 'COLLECTIVE_GOALS',
};

const FeatureAllowedForTypes = {
  [FEATURES.CONVERSATIONS]: [CollectiveType.COLLECTIVE, CollectiveType.EVENT],
};

const OPT_IN_FLAGS = {
  [FEATURES.CONVERSATIONS]: 'settings.features.conversations',
  [FEATURES.COLLECTIVE_GOALS]: 'settings.collectivePage.showGoals',
};

/**
 * Check if the given feature is activated for collective.
 */
const hasFeature = (collective, feature) => {
  if (!collective) {
    return false;
  }

  // Check collective type
  const allowedTypes = FeatureAllowedForTypes[feature];
  if (allowedTypes && !allowedTypes.includes(collective.type)) {
    return false;
  }

  // Check opt-in flags
  const activationFlag = OPT_IN_FLAGS[feature];
  if (activationFlag) {
    return Boolean(get(collective, activationFlag, false));
  }

  return true;
};

export default hasFeature;
