import { createIntl } from 'react-intl';

import { CollectiveType } from '@/lib/constants/collectives';
import { TierTypes } from '@/lib/constants/tiers-types';

import { getTierTypeOptions } from './EditTierModal';

const intl = createIntl({ locale: 'en', defaultLocale: 'en' });

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
