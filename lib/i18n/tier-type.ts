import { defineMessages } from 'react-intl';

import { TierTypes } from '../constants/tiers-types';

const messages = defineMessages({
  [TierTypes.TIER]: { id: 'tier.type.tier', defaultMessage: 'generic tier' },
  [TierTypes.SERVICE]: { id: 'tier.type.service', defaultMessage: 'service (e.g., support)' },
  [TierTypes.PRODUCT]: { id: 'tier.type.product', defaultMessage: 'product (e.g., t-shirt)' },
  [TierTypes.DONATION]: { id: 'tier.type.donation', defaultMessage: 'donation (gift)' },
  [TierTypes.MEMBERSHIP]: { id: 'tier.type.membership', defaultMessage: 'membership (recurring)' },
});

export const i18nTierType = (intl, tierType) => {
  return messages[tierType] ? intl.formatMessage(messages[tierType]) : tierType;
};
