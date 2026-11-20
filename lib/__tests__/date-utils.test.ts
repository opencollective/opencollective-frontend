import { toIsoDateStr } from '../date-utils';

/**
 * Tests run with TZ=UTC, so this mocks the local getters to simulate a date seen from another timezone.
 */
const mockLocalDate = (isoString: string, { year, month, day }: { year: number; month: number; day: number }) => {
  const date = new Date(isoString);
  jest.spyOn(date, 'getFullYear').mockReturnValue(year);
  jest.spyOn(date, 'getMonth').mockReturnValue(month - 1);
  jest.spyOn(date, 'getDate').mockReturnValue(day);
  return date;
};

describe('lib/date-utils', () => {
  describe('toIsoDateStr', () => {
    it('formats the date as YYYY-MM-DD', () => {
      expect(toIsoDateStr(new Date('2026-03-05T12:00:00Z'))).toBe('2026-03-05');
      expect(toIsoDateStr(new Date('2026-12-31T23:59:59Z'))).toBe('2026-12-31');
    });

    it('uses the local day when the local date is ahead of UTC', () => {
      // 1 AM on November 1st in UTC+3 is still October 31st in UTC
      const date = mockLocalDate('2026-10-31T22:00:00Z', { year: 2026, month: 11, day: 1 });
      expect(toIsoDateStr(date)).toBe('2026-11-01');
    });

    it('uses the local day when the local date is behind UTC', () => {
      // 8 PM on October 31st in UTC-5 is already November 1st in UTC
      const date = mockLocalDate('2026-11-01T01:00:00Z', { year: 2026, month: 10, day: 31 });
      expect(toIsoDateStr(date)).toBe('2026-10-31');
    });
  });
});
