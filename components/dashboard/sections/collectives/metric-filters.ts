import type { IntlShape } from 'react-intl';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import dayjs from '@/lib/dayjs';

const metricDateRangeSchema = z
  .object({
    from: z.string(),
    to: z.string(),
  })
  .optional();

export const metricFilterSchema = {
  joinedBetween: metricDateRangeSchema,
  unhostedBetween: metricDateRangeSchema,
  hadActivityBetween: metricDateRangeSchema,
  noActivityBetween: metricDateRangeSchema,
};

const toMetricRangeVar = (value: { from?: string; to?: string } | undefined) =>
  value?.from && value?.to ? { from: value.from, to: value.to } : undefined;

export const metricFilterToVariables = {
  joinedBetween: (value: { from?: string; to?: string } | undefined) => ({ joinedBetween: toMetricRangeVar(value) }),
  unhostedBetween: (value: { from?: string; to?: string } | undefined) => ({
    unhostedBetween: toMetricRangeVar(value),
  }),
  hadActivityBetween: (value: { from?: string; to?: string } | undefined) => ({
    hadActivityBetween: toMetricRangeVar(value),
  }),
  noActivityBetween: (value: { from?: string; to?: string } | undefined) => ({
    noActivityBetween: toMetricRangeVar(value),
  }),
};

const formatMetricRange = (value: unknown, intl: IntlShape): string => {
  const v = value as { from?: string; to?: string } | undefined;
  if (!v?.from || !v?.to) {
    return '';
  }
  const from = dayjs.utc(v.from);
  const to = dayjs.utc(v.to);
  if (!from.isValid() || !to.isValid()) {
    return '';
  }
  const sameYear = from.year() === to.year();
  const fromLabel = intl.formatDate(from.toDate(), {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  });
  const toLabel = intl.formatDate(to.toDate(), { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${fromLabel} – ${toLabel}`;
};

const metricRangeFilterPill = (labelMsg: ReturnType<typeof defineMessage>) => ({
  labelMsg,
  valueRenderer: ({ value, intl }: { value: unknown; intl?: IntlShape }) =>
    intl ? formatMetricRange(value, intl) : '',
});

export const metricFilterConfigs = {
  joinedBetween: metricRangeFilterPill(defineMessage({ defaultMessage: 'Joined host on', id: 'btsegv' })),
  unhostedBetween: metricRangeFilterPill(defineMessage({ defaultMessage: 'Left host on', id: 'DhBUgD' })),
  hadActivityBetween: metricRangeFilterPill(
    defineMessage({ defaultMessage: 'Had financial activity on', id: 'b8tWyl' }),
  ),
  noActivityBetween: metricRangeFilterPill(defineMessage({ defaultMessage: 'No financial activity on', id: '5A+fYY' })),
};
