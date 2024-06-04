import React from 'react';
import { gql, useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { groupBy, orderBy, sumBy } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { integer } from '../../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../../lib/graphql/helpers';
import type {
  HostExpensesReportListQuery,
  HostExpensesReportListQueryVariables,
} from '../../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../../lib/hooks/useQueryFilter';

import FormattedMoneyAmount from '../../../../FormattedMoneyAmount';
import Loading from '../../../../Loading';
import MessageBoxGraphqlError from '../../../../MessageBoxGraphqlError';
import { DataTable } from '../../../../table/DataTable';
import Tabs from '../../../../Tabs';
import DashboardHeader from '../../../DashboardHeader';
import { Pagination } from '../../../filters/Pagination';
import type { DashboardSectionProps } from '../../../types';
import { CurrentPeriodBadge } from '../../reports/preview/CurrentPeriodBadge';
import { renderReportPeriodLabel, serializeReportSlug } from '../../reports/preview/ReportPeriodSelector';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../ui/Tooltip';

const schema = z.object({
  timeUnit: z.enum(['MONTH', 'QUARTER', 'YEAR']).default('MONTH'),
  limit: integer.default(10),
  offset: integer.default(0),
});

const getColumns = intl => [
  {
    accessorKey: 'period',
    header: intl.formatMessage({ id: 'Period', defaultMessage: 'Period' }),
    cell: ({ cell }) => {
      const period = cell.getValue();
      return (
        <span className="flex items-center gap-2 font-medium">
          {renderReportPeriodLabel(period)}
          <CurrentPeriodBadge variables={period} />
        </span>
      );
    },
  },
  {
    accessorKey: 'managedExpensesTotal',
    meta: { className: 'w-44 text-right' },
    header: intl.formatMessage({ defaultMessage: 'Managed expenses', id: 'nUoOoO' }),
    cell: ({ cell, row }) => {
      const amount = cell.getValue();
      const count = row.original.managedExpensesCount;
      return (
        <div className="inline-flex gap-1 font-normal text-muted-foreground">
          <FormattedMoneyAmount
            amount={amount.valueInCents}
            currency={amount.currency}
            amountStyles={{ letterSpacing: 0 }}
            showCurrencyCode={false}
          />
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <div className="text-xs text-slate-400">({count})</div>
            </TooltipTrigger>
            <TooltipContent>
              <FormattedMessage
                defaultMessage="{n, plural, one {one expense} other {{n} expenses}}"
                id="xyYeS2"
                values={{ n: count }}
              />
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
  {
    accessorKey: 'operationalExpensesTotal',
    meta: { className: 'w-44 text-right' },
    header: intl.formatMessage({ defaultMessage: 'Operational expenses', id: 'SMApM2' }),
    cell: ({ cell, row }) => {
      const amount = cell.getValue();
      const count = row.original.operationalExpensesCount;
      return (
        <div className="inline-flex gap-1 font-normal text-muted-foreground">
          <FormattedMoneyAmount
            amount={amount.valueInCents}
            currency={amount.currency}
            amountStyles={{ letterSpacing: 0 }}
            showCurrencyCode={false}
          />
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <div className="text-xs text-slate-400">({count})</div>
            </TooltipTrigger>
            <TooltipContent>
              <FormattedMessage
                defaultMessage="{n, plural, one {1 expense} other {{n} expenses}}"
                id="xyYeS2"
                values={{ n: count }}
              />
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];

export function HostExpensesReportList(props: DashboardSectionProps) {
  const queryFilter = useQueryFilter({
    filters: {},
    schema,
  });

  const query = useQuery<HostExpensesReportListQuery, HostExpensesReportListQueryVariables>(
    gql`
      query HostExpensesReportList($accountSlug: String!, $timeUnit: TimeUnit, $dateFrom: DateTime, $dateTo: DateTime) {
        host(slug: $accountSlug) {
          hostExpensesReport(timeUnit: $timeUnit, dateFrom: $dateFrom, dateTo: $dateTo) {
            timeUnit
            dateFrom
            dateTo
            nodes {
              date
              isHost
              amount {
                currency
                valueInCents
              }
              count
            }
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        accountSlug: props.accountSlug,
        ...queryFilter.variables,
      },
    },
  );

  const { error, loading } = query;

  const intl = useIntl();
  const tabs = React.useMemo(
    () => [
      { id: 'MONTH', label: intl.formatMessage({ id: 'Frequency.Monthly', defaultMessage: 'Monthly' }) },
      { id: 'QUARTER', label: intl.formatMessage({ id: 'quarter', defaultMessage: 'Quarterly' }) },
      { id: 'YEAR', label: intl.formatMessage({ id: 'Frequency.Yearly', defaultMessage: 'Yearly' }) },
    ],
    [intl],
  );

  const onChangeTab = React.useCallback(
    id => {
      queryFilter.setFilters({ timeUnit: id, offset: 0 });
    },
    [queryFilter],
  );

  const listData = React.useMemo(() => {
    if (!query.data?.host?.hostExpensesReport?.nodes) {
      return [];
    }

    const timeUnit = query.data?.host?.hostExpensesReport?.timeUnit;

    const result = [];
    const byDate = groupBy(query.data?.host?.hostExpensesReport?.nodes, 'date');
    Object.entries(byDate).forEach(([date, values]) => {
      const managedValueInCents = sumBy(
        values.filter(v => !v.isHost),
        'amount.valueInCents',
      );
      const managedExpensesCount = sumBy(
        values.filter(v => !v.isHost),
        'count',
      );
      const operationalValueInCents = sumBy(
        values.filter(v => v.isHost),
        'amount.valueInCents',
      );
      const operationalExpensesCount = sumBy(
        values.filter(v => v.isHost),
        'count',
      );
      result.push({
        period: {
          dateFrom: dayjs
            .utc(date)
            .startOf(timeUnit as any)
            .toISOString(),
          dateTo: dayjs
            .utc(date)
            .endOf(timeUnit as any)
            .toISOString(),
          timeUnit,
        },
        managedExpensesCount,
        operationalExpensesCount,
        managedExpensesTotal: {
          currency: values[0].amount.currency,
          valueInCents: managedValueInCents,
        },
        operationalExpensesTotal: {
          currency: values[0].amount.currency,
          valueInCents: operationalValueInCents,
        },
      });
    });

    return orderBy(result, 'period.dateFrom', 'desc');
  }, [query.data?.host?.hostExpensesReport?.nodes, query.data?.host?.hostExpensesReport?.timeUnit]);

  const columns = getColumns(intl);
  const { limit, offset } = queryFilter.values;

  return (
    <React.Fragment>
      <div className="flex max-w-screen-lg flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage defaultMessage="Expense Reports" id="qC0ZXX" />}
          titleRoute={`/dashboard/${props.accountSlug}/host-expense-report`}
        />

        <div className="space-y-6">
          <Tabs selectedId={queryFilter.values.timeUnit} onChange={onChangeTab} tabs={tabs} />
          {loading ? (
            <Loading />
          ) : error ? (
            <MessageBoxGraphqlError error={error} />
          ) : (
            <React.Fragment>
              <div className="space-y-10 overflow-hidden rounded-xl border pb-4">
                <DataTable
                  innerClassName="table-fixed"
                  columns={columns}
                  loading={loading}
                  mobileTableView
                  nbPlaceholders={queryFilter.values.limit}
                  data={listData.slice(offset, offset + limit)}
                  onClickRow={row => {
                    queryFilter.resetFilters(
                      {},
                      `/dashboard/${props.accountSlug}/host-expenses-report/${serializeReportSlug(row.original.period)}`,
                    );
                  }}
                />
              </div>
              <Pagination queryFilter={queryFilter} total={query.data?.host?.hostExpensesReport?.nodes?.length} />
            </React.Fragment>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

function CountWithTooltip() {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild></TooltipTrigger>
      <TooltipContent></TooltipContent>
    </Tooltip>
  );
}
