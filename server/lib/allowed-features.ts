import { types } from '../constants/collectives';

export enum FEATURES {
  CONVERSATIONS,
}

const FeatureAllowedForTypes = {
  [FEATURES.CONVERSATIONS]: [types.COLLECTIVE],
};

/**
 * Check if the given feature is activated for collective.
 */
const hasFeature = (collective, feature: FEATURES): boolean => {
  const allowedTypes = FeatureAllowedForTypes[feature];
  return collective && allowedTypes && allowedTypes.includes(collective.type);
};

export default hasFeature;
