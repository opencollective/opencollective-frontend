import dayjs from 'dayjs';

import { isValidRecurrenceEndAt, RecurrenceFrequencyOption } from './useExpenseForm';

describe('isValidRecurrenceEndAt', () => {
  it('accepts an empty end date (open-ended recurrence)', () => {
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, undefined)).toBe(true);
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, null)).toBe(true);
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, '')).toBe(true);
  });

  it('accepts any end date when recurrence is disabled', () => {
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.NONE, '2020-01-01')).toBe(true);
    expect(isValidRecurrenceEndAt(undefined, '2020-01-01')).toBe(true);
  });

  it('only accepts end dates that are valid dates in the future', () => {
    const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, tomorrow)).toBe(true);
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, yesterday)).toBe(false);
    expect(isValidRecurrenceEndAt(RecurrenceFrequencyOption.MONTH, 'not-a-date')).toBe(false);
  });
});
