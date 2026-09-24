import {
  Currency,
  HostedCollectivesTransactionSizesAmountBand as AmountBand,
  HostedCollectivesTransactionSizesKindClass as KindClass,
} from '@/lib/graphql/types/v2/graphql';

import { bandHistogram, ORDERED_AMOUNT_BANDS } from './financialActivity';

describe('financialActivity / amount bands', () => {
  describe('ORDERED_AMOUNT_BANDS', () => {
    it('covers every enum token exactly once', () => {
      const tokens = ORDERED_AMOUNT_BANDS.map(b => b.token).sort();
      expect(tokens).toEqual([...Object.values(AmountBand)].sort());
    });

    it('is ordered by upper bound, with each lower bound matching the previous upper', () => {
      const uppers = ORDERED_AMOUNT_BANDS.map(b => b.upperBound);
      expect(uppers).toEqual([...uppers].sort((a, b) => a - b));
      ORDERED_AMOUNT_BANDS.forEach((band, i) => {
        expect(band.lowerBound).toBe(i === 0 ? 0 : ORDERED_AMOUNT_BANDS[i - 1].upperBound);
      });
    });

    it('starts at GT_0_LTE_5 and ends with the open-ended overflow band', () => {
      const first = ORDERED_AMOUNT_BANDS[0];
      expect(first.token).toBe(AmountBand.GT_0_LTE_5);
      expect(first.lowerBound).toBe(0);
      expect(first.upperBound).toBe(5);

      const last = ORDERED_AMOUNT_BANDS[ORDERED_AMOUNT_BANDS.length - 1];
      expect(last.token).toBe(AmountBand.GT_50000);
      expect(last.lowerBound).toBe(50000);
      expect(last.upperBound).toBe(Number.POSITIVE_INFINITY);
    });

    it('reads each band lower bound from its own token, not its neighbour', () => {
      const mid = ORDERED_AMOUNT_BANDS.find(b => b.token === AmountBand.GT_25_LTE_50);
      expect(mid).toMatchObject({ lowerBound: 25, upperBound: 50 });
    });
  });

  describe('bandHistogram', () => {
    type SizeRows = Parameters<typeof bandHistogram>[0];
    const row = (kindClass: KindClass, amountBand: AmountBand, transactionCount: number, valueInCents: number) =>
      ({
        group: { kindClass, amountBand },
        values: { transactionCount, amount: { valueInCents, currency: Currency.USD } },
      }) satisfies SizeRows[number];

    it('keeps one ordered, dense bar per band (empty bands stay at zero)', () => {
      const bars = bandHistogram([], KindClass.CONTRIBUTION);
      expect(bars).toHaveLength(ORDERED_AMOUNT_BANDS.length);
      expect(bars.map(b => b.token)).toEqual(ORDERED_AMOUNT_BANDS.map(b => b.token));
      expect(bars.every(b => b.count === 0 && b.amount === 0)).toBe(true);
    });

    it('buckets rows by token and sums count + absolute amount', () => {
      const rows = [
        row(KindClass.CONTRIBUTION, AmountBand.GT_0_LTE_5, 1, 300),
        row(KindClass.CONTRIBUTION, AmountBand.GT_25_LTE_50, 2, 6000),
      ];
      const bars = bandHistogram(rows, KindClass.CONTRIBUTION);
      const byToken = new Map(bars.map(b => [b.token, b]));
      expect(byToken.get(AmountBand.GT_0_LTE_5)?.count).toBe(1);
      expect(byToken.get(AmountBand.GT_25_LTE_50)?.count).toBe(2);
      expect(byToken.get(AmountBand.GT_25_LTE_50)?.amount).toBe(6000);
      expect(byToken.get(AmountBand.GT_5_LTE_10)?.count).toBe(0);
    });

    it('ignores rows from the other kind class', () => {
      const rows = [
        row(KindClass.CONTRIBUTION, AmountBand.GT_0_LTE_5, 1, 300),
        row(KindClass.PAYOUT, AmountBand.GT_150_LTE_200, 1, 20000),
      ];
      const contributions = bandHistogram(rows, KindClass.CONTRIBUTION);
      const payouts = bandHistogram(rows, KindClass.PAYOUT);
      expect(contributions.find(b => b.token === AmountBand.GT_0_LTE_5)?.count).toBe(1);
      expect(contributions.find(b => b.token === AmountBand.GT_150_LTE_200)?.count).toBe(0);
      expect(payouts.find(b => b.token === AmountBand.GT_150_LTE_200)?.count).toBe(1);
    });
  });
});
