import { createIntl } from 'react-intl';

import { CollectiveType } from '@/lib/constants/collectives';
import { TierTypes } from '@/lib/constants/tiers-types';

import {
  applyMinimumAmountToFlexibleTierValues,
  createTierPresets,
  getTierTypeOptions,
  validateTierFormValues,
} from './EditTierModal';
import { getNextPresetAmount } from './TierPresetsEditor';

const intl = createIntl({ locale: 'en', defaultLocale: 'en' });

const collective = { type: CollectiveType.COLLECTIVE, currency: 'USD' };

const ALL_TIER_TYPES = [TierTypes.TIER, TierTypes.SERVICE, TierTypes.PRODUCT, TierTypes.DONATION, TierTypes.MEMBERSHIP];
const NO_TAXABLE_TYPES = [TierTypes.TIER, TierTypes.DONATION, TierTypes.MEMBERSHIP];

describe('EditTierModal - getTierTypeOptions', () => {
  it('excludes PRODUCT and SERVICE when supportedTierTypes omits them', () => {
    const options = getTierTypeOptions(intl, CollectiveType.COLLECTIVE, NO_TAXABLE_TYPES);
    const values = options.map(opt => opt.value);
    expect(values).not.toContain(TierTypes.PRODUCT);
    expect(values).not.toContain(TierTypes.SERVICE);
    expect(values).toContain(TierTypes.TIER);
    expect(values).toContain(TierTypes.DONATION);
    expect(values).toContain(TierTypes.MEMBERSHIP);
  });

  it('includes all types including PRODUCT and SERVICE when supportedTierTypes includes them', () => {
    const options = getTierTypeOptions(intl, CollectiveType.COLLECTIVE, ALL_TIER_TYPES);
    const values = options.map(opt => opt.value);
    expect(values).toContain(TierTypes.PRODUCT);
    expect(values).toContain(TierTypes.SERVICE);
    expect(values).toContain(TierTypes.TIER);
    expect(values).toContain(TierTypes.DONATION);
    expect(values).toContain(TierTypes.MEMBERSHIP);
  });

  it('excludes MEMBERSHIP for PROJECT collective type when supportedTierTypes omits it', () => {
    const projectTypes = [TierTypes.TIER, TierTypes.SERVICE, TierTypes.PRODUCT, TierTypes.DONATION];
    const options = getTierTypeOptions(intl, CollectiveType.PROJECT, projectTypes);
    const values = options.map(opt => opt.value);
    expect(values).not.toContain(TierTypes.MEMBERSHIP);
  });
});

describe('EditTierModal - validateTierFormValues', () => {
  it('rejects flexible tiers with presets lower than minimum amount', () => {
    const errors = validateTierFormValues(
      {
        name: 'Supporter',
        type: TierTypes.TIER,
        amountType: 'FLEXIBLE',
        minimumAmount: { valueInCents: 7000, currency: 'USD' },
        presets: [1000, 2500, 5000],
      },
      intl,
    );

    expect(errors.presets?.[0]).toBeDefined();
    expect(errors.presets?.[1]).toBeDefined();
    expect(errors.presets?.[2]).toBeDefined();
    expect(errors).not.toHaveProperty('minimumAmount');
  });

  it('accepts flexible tiers when presets meet minimum amount', () => {
    const errors = validateTierFormValues(
      {
        name: 'Supporter',
        type: TierTypes.TIER,
        amountType: 'FLEXIBLE',
        minimumAmount: { valueInCents: 7000, currency: 'USD' },
        presets: [7000, 10000, 20000],
      },
      intl,
    );

    expect(errors).not.toHaveProperty('minimumAmount');
  });
});

describe('EditTierModal - applyMinimumAmountToFlexibleTierValues', () => {
  it('generates presets and default amount from minimum on create', () => {
    const minimumAmount = { valueInCents: 7000, currency: 'USD' };
    const updates = applyMinimumAmountToFlexibleTierValues({
      minimumAmount,
      collective,
    });

    expect(updates.presets).toEqual(createTierPresets(collective, minimumAmount));
    expect(updates.amount).toEqual({ currency: 'USD', valueInCents: 20000 });
  });

  it('resets presets when minimum is cleared on create', () => {
    const updates = applyMinimumAmountToFlexibleTierValues({
      minimumAmount: null,
      collective,
    });

    expect(updates.presets).toEqual([500, 1000, 2000, 5000]);
    expect(updates.amount).toEqual({ currency: 'USD', valueInCents: 2000 });
  });

  it('regenerates presets from minimum even when current presets differ', () => {
    const updates = applyMinimumAmountToFlexibleTierValues({
      minimumAmount: { valueInCents: 10000, currency: 'USD' },
      collective,
    });

    expect(updates.presets).toEqual(createTierPresets(collective, { valueInCents: 10000, currency: 'USD' }));
  });
});

describe('TierPresetsEditor - getNextPresetAmount', () => {
  it('suggests the minimum when there are no presets yet', () => {
    expect(getNextPresetAmount([], 2000)).toBe(2000);
  });

  it('adds a step based on the last interval between presets', () => {
    expect(getNextPresetAmount([2000, 4000, 6000], 2000)).toBe(8000);
  });
});
