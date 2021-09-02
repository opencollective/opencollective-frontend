import INTERVALS from '../../lib/constants/intervals';
import { AmountTypes, TierTypes } from '../../lib/constants/tiers-types';

export const flexibleIntervalTier = {
  amountType: AmountTypes.FLEXIBLE,
  interval: INTERVALS.flexible,
  minimumAmount: {
    currency: 'USD',
    valueInCents: 500,
  },
  name: 'Flexible Interval',
  availableQuantity: 10,
  maxQuantity: 15,
  type: TierTypes.TIER,
  amount: {
    currency: 'USD',
    valueInCents: 2000,
  },
};

export const recurringIntervalTier = {
  amountType: AmountTypes.FLEXIBLE,
  interval: INTERVALS.month,
  minimumAmount: {
    currency: 'EUR',
    valueInCents: 1500,
  },
  name: 'One Time Interval',
  availableQuantity: 13,
  maxQuantity: 19,
  type: TierTypes.TIER,
  amount: {
    currency: 'EUR',
    valueInCents: 6000,
  },
};
