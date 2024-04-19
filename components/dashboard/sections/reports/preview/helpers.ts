import { isNil } from 'lodash';

import { getDayjsIsoUnit } from '../../../../../lib/date-utils';
import dayjs from '../../../../../lib/dayjs';
import { TimeUnit } from '../../../../../lib/graphql/types/v2/graphql';

import { DateFilterType } from '../../../filters/DateFilter/schema';
import { FilterValues as HostTransactionsFilterValues } from '../../transactions/HostTransactions';

import { GroupFilter } from './types';

export const isCurrentPeriod = variables => {
  const now = dayjs.utc();
  const dateFrom = dayjs.utc(variables.dateFrom);
  const dayjsIsoUnit = getDayjsIsoUnit(variables.timeUnit as TimeUnit);
  return dateFrom.isSame(now.startOf(dayjsIsoUnit), dayjsIsoUnit);
};

export const filterToHostTransactionsFilterValues = (
  hostSlug,
  groupFilter: GroupFilter,
  variables,
): Partial<HostTransactionsFilterValues> => {
  return {
    ...(groupFilter.isHost
      ? {
          account: hostSlug,
        }
      : {
          excludeAccount: hostSlug,
        }),
    ...(groupFilter.kind && {
      kind: [groupFilter.kind],
    }),
    ...(groupFilter.type && {
      type: groupFilter.type,
    }),
    ...(groupFilter.expenseType && {
      expenseType: [groupFilter.expenseType],
    }),
    ...(!isNil(groupFilter.isRefund) && {
      isRefund: groupFilter.isRefund,
    }),
    date: {
      gte: dayjs.utc(variables.dateFrom).format('YYYY-MM-DD'),
      lte: dayjs.utc(variables.dateTo).format('YYYY-MM-DD'),
      type: DateFilterType.BETWEEN,
      tz: 'UTC',
    },
  };
};

export const filterToTransactionsFilterValues = (
  groupFilter: GroupFilter,
  variables,
): Partial<HostTransactionsFilterValues> => {
  return {
    ...(groupFilter.kind && {
      kind: [groupFilter.kind],
    }),
    ...(groupFilter.type && {
      type: groupFilter.type,
    }),
    ...(groupFilter.expenseType && {
      expenseType: [groupFilter.expenseType],
    }),
    ...(!isNil(groupFilter.isRefund) && {
      isRefund: groupFilter.isRefund,
    }),
    date: {
      gte: dayjs.utc(variables.dateFrom).format('YYYY-MM-DD'),
      lte: dayjs.utc(variables.dateTo).format('YYYY-MM-DD'),
      type: DateFilterType.BETWEEN,
      tz: 'UTC',
    },
  };
};
