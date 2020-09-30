import { getTierPresets } from '../tier-utils';

const getTierWithMin = min => ({ minimumAmount: { valueInCents: min } });

describe('getTierPresets', () => {
  it('returns the tier presets if they exist', () => {
    const presets = [666, 4222, 7777];
    expect(getTierPresets({ presets })).toEqual(presets);
  });

  it('returns default presets if nothing given', () => {
    expect(getTierPresets()).toEqual([500, 1000, 2000, 5000]);
  });

  it('returns default presets for funds', () => {
    expect(getTierPresets(null, 'FUND')).toEqual([100000, 200000, 500000, 1000000]);
  });

  it('returns default presets for free tiers', () => {
    expect(getTierPresets(getTierWithMin(0))).toEqual([0, 500, 1500, 5000]);
  });

  it('returns automatically generated presets based on minimum amount', () => {
    // Value < $100
    expect(getTierPresets(getTierWithMin(100))).toEqual([100, 1000, 2500, 5000]);
    expect(getTierPresets(getTierWithMin(500))).toEqual([500, 1000, 2500, 5000]);

    // Value > $100
    expect(getTierPresets(getTierWithMin(1000))).toEqual([1000, 2000, 3000, 5000]);
    expect(getTierPresets(getTierWithMin(5000))).toEqual([5000, 10000, 20000, 30000]);
    expect(getTierPresets(getTierWithMin(7555))).toEqual([7555, 20000, 40000]);
    expect(getTierPresets(getTierWithMin(80000))).toEqual([80000, 200000, 400000]);
  });
});
