import { types } from '../constants/collectives';
import FEATURE from '../constants/feature';

const FeatureAllowedForTypes = {
  [FEATURE.CONVERSATIONS]: [types.COLLECTIVE, types.ORGANIZATION],
};

/**
 * Check if the given feature is activated for collective.
 */
const hasFeature = (collective, feature: FEATURE): boolean => {
  const allowedTypes = FeatureAllowedForTypes[feature];
  return collective && allowedTypes && allowedTypes.includes(collective.type);
};

export default hasFeature;
