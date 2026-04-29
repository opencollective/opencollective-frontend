import type { IntlShape } from 'react-intl';

import dayjs from '@/lib/dayjs';

import { ALL_SECTIONS } from '../../../dashboard/constants';

export type MonthPeriod = { from: string; to: string; label: string };

export function monthPeriodFor(date: dayjs.Dayjs, intl: IntlShape, isCurrent = false): MonthPeriod {
  const start = date.utc().startOf('month');
  return {
    from: start.toISOString(),
    to: start.add(1, 'month').toISOString(),
    label: isCurrent
      ? intl.formatMessage({ defaultMessage: 'Current Month', id: 'Jr9hau' })
      : intl.formatDate(start.toDate(), { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
}

export function recentMonths(intl: IntlShape, count = 12): MonthPeriod[] {
  const now = dayjs.utc();
  const periods: MonthPeriod[] = [];
  for (let i = 0; i < count; i++) {
    periods.push(monthPeriodFor(now.subtract(i, 'month'), intl, i === 0));
  }
  return periods;
}

export function previousPeriod(period: MonthPeriod): { from: string; to: string } {
  const start = dayjs.utc(period.from).subtract(1, 'month');
  return {
    from: start.toISOString(),
    to: start.add(1, 'month').toISOString(),
  };
}

export function hostedAccountsRoute(opts: {
  hostSlug: string;
  category: 'COLLECTIVE' | 'FUND';
  filter: 'joinedBetween' | 'unhostedBetween' | 'hadActivityBetween' | 'noActivityBetween';
  range: { from: string; to: string };
  drawerAccountId?: string;
}) {
  const section = opts.category === 'FUND' ? ALL_SECTIONS.HOSTED_FUNDS : ALL_SECTIONS.HOSTED_COLLECTIVES;
  const subpath = opts.drawerAccountId ? `/${opts.drawerAccountId}` : '';
  return {
    pathname: `/dashboard/${opts.hostSlug}/${section}${subpath}`,
    query: {
      [`${opts.filter}[from]`]: opts.range.from,
      [`${opts.filter}[to]`]: opts.range.to,
    },
  };
}

export function hostedAccountDrawerRoute(hostSlug: string, category: 'COLLECTIVE' | 'FUND', accountId: string) {
  const section = category === 'FUND' ? ALL_SECTIONS.HOSTED_FUNDS : ALL_SECTIONS.HOSTED_COLLECTIVES;
  return {
    pathname: `/dashboard/${hostSlug}/${section}/${accountId}`,
  };
}

export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}
