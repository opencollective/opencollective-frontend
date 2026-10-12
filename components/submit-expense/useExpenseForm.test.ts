import dayjs from 'dayjs';

import { getRecurringExpenseInput, isValidRecurrenceEndAt, RecurrenceFrequencyOption } from './useExpenseForm';

describe('getRecurringExpenseInput', () => {
  it('returns undefined when recurrence is disabled', () => {
    expect(getRecurringExpenseInput(RecurrenceFrequencyOption.NONE)).toBeUndefined();
    expect(getRecurringExpenseInput(undefined)).toBeUndefined();
    expect(getRecurringExpenseInput(RecurrenceFrequencyOption.NONE, '2125-09-29')).toBeUndefined();
  });

  it('returns a null endsAt when no end date is set (open-ended recurrence)', () => {
    // Regression test for https://github.com/opencollective/opencollective/issues/8907:
    // `dayjs(undefined).toDate()` returns the current time, so every submission without
    // an end date created a recurring expense that could never recur.
    const withoutEndDate = getRecurringExpenseInput(RecurrenceFrequencyOption.MONTH, undefined);
    expect(withoutEndDate).toEqual({ interval: 'month', endsAt: null });

    const withClearedEndDate = getRecurringExpenseInput(RecurrenceFrequencyOption.MONTH, '');
    expect(withClearedEndDate).toEqual({ interval: 'month', endsAt: null });
  });

  it('returns the end date when a valid one is set', () => {
    expect(getRecurringExpenseInput(RecurrenceFrequencyOption.QUARTER, '2125-09-29')).toEqual({
      interval: 'quarter',
      endsAt: dayjs('2125-09-29').toDate(),
    });
  });

  it('returns a null endsAt for invalid dates instead of defaulting to the current time', () => {
    expect(getRecurringExpenseInput(RecurrenceFrequencyOption.MONTH, 'not-a-date')).toEqual({
      interval: 'month',
      endsAt: null,
    });
  });
});

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
