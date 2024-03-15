import React from 'react';
import { useQuery } from '@apollo/client';
import { toNumber } from 'lodash';
// Using Next.js Link directly, as components/Link currently does not handle refs
// eslint-disable-next-line no-restricted-imports
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import dayjs from '../../../../../lib/dayjs';
import { integer } from '../../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../../lib/hooks/useQueryFilter';

import FormattedMoneyAmount from '../../../../FormattedMoneyAmount';
import MessageBoxGraphqlError from '../../../../MessageBoxGraphqlError';
import Tabs from '../../../../Tabs';
import { Badge } from '../../../../ui/Badge';
import { Pagination } from '../../../../ui/Pagination';
import { Skeleton } from '../../../../ui/Skeleton';
import { DashboardContext } from '../../../DashboardContext';
import DashboardHeader from '../../../DashboardHeader';
import { DashboardSectionProps } from '../../../types';

import { hostReportQuery } from './queries';
import { isCurrentPeriod, renderReportPeriodLabel, serializeReportSlug } from './ReportPeriodSelector';
import { CurrentPeriodBadge } from './CurrentPeriodBadge';
import { DataTable } from '../../../../DataTable';

const schema = z.object({
  timeUnit: z.enum(['MONTH', 'QUARTER', 'YEAR']).default('MONTH'),
  limit: integer.default(10),
  offset: integer.default(0),
});

const getColumns = intl => [
  {
    accessorKey: 'period',
    header: intl.formatMessage({ defaultMessage: 'Period' }),
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
    accessorKey: 'managedFundsTotalChange',
    meta: { className: 'w-44 text-right' },
    header: intl.formatMessage({ defaultMessage: 'Managed funds net' }),
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return (
        <div className="font-normal text-muted-foreground">
          {amount.valueInCents > 0 && '+'}
          <FormattedMoneyAmount
            amount={amount.valueInCents}
            currency={amount.currency}
            amountStyles={{ letterSpacing: 0 }}
            showCurrencyCode={false}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'operationalFundsTotalChange',
    meta: { className: 'w-44 text-right' },
    header: intl.formatMessage({ defaultMessage: 'Operational funds net' }),
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return (
        <div className="font-normal text-muted-foreground">
          {amount.valueInCents > 0 && '+'}
          <FormattedMoneyAmount
            amount={amount.valueInCents}
            currency={amount.currency}
            amountStyles={{ letterSpacing: 0 }}
            showCurrencyCode={false}
          />
        </div>
      );
    },
  },
];

const HostTransactionReportList = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const { account } = React.useContext(DashboardContext);
  const intl = useIntl();
  const queryFilter = useQueryFilter({
    filters: {},
    schema,
    meta: {
      hostCreatedAt: account.createdAt, // Remove the need for this?
    },
  });

  const { loading, error, data } = useQuery(hostReportQuery, {
    variables: {
      hostSlug,
      ...queryFilter.variables,
      includeGroups: false,
    },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-first',
  });
  const columns = getColumns(intl);
  const { limit, offset } = queryFilter.values;
  const pages = Math.ceil((data?.host?.hostTransactionsReports?.nodes.length || 1) / limit);
  const currentPage = toNumber(offset + limit) / limit;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="Reports" defaultMessage="Reports" />}
        actions={<div className="flex items-center gap-2"></div>}
      />

      <Tabs
        selectedId={queryFilter.values.timeUnit}
        onChange={id => queryFilter.setFilters({ timeUnit: id, offset: 0 })}
        tabs={[
          { id: 'MONTH', label: 'Monthly' },
          { id: 'QUARTER', label: 'Quarterly' },
          { id: 'YEAR', label: 'Yearly' },
        ]}
      />

      <div>
        {true ? null : (
          <div className="flex items-center justify-between p-4 text-sm font-medium text-muted-foreground">
            <div>Period</div>
            <div className="grid w-[400px] grid-cols-2 text-right">
              <div>Managed funds</div>
              <div>Operational funds</div>
            </div>
          </div>
        )}
        {/* <div className="mb-2 divide-y overflow-hidden rounded-xl border"> */}

        <div>
          {false ? (
            Array(10)
              .fill(null)
              .map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} className="p-4">
                  <Skeleton className="h-5 w-1/4" />
                </div>
              ))
          ) : error ? (
            <MessageBoxGraphqlError error={error} />
          ) : true ? (
            <DataTable
              innerClassName="table-fixed"
              columns={columns}
              loading={loading}
              nbPlaceholders={queryFilter.values.limit}
              onClickRow={row => {
                console.log({ row });
                queryFilter.resetFilters(
                  {},
                  `/dashboard/${account.slug}/reports/${serializeReportSlug(row.original.period)}`,
                );
              }}
              data={data?.host?.hostTransactionsReports?.nodes.slice(offset, offset + limit).map(n => {
                const timeUnit = data.host.hostTransactionsReports.timeUnit;
                const period = {
                  dateFrom: dayjs.utc(n.date).startOf(timeUnit).toISOString(),
                  dateTo: dayjs.utc(n.date).endOf(timeUnit).toISOString(),
                  timeUnit,
                };
                // const reportSlug = serializeReportSlug(period);

                return {
                  period,
                  managedFundsTotalChange: n.managedFunds.totalChange,
                  operationalFundsTotalChange: n.operationalFunds.totalChange,
                };
              })}
            />
          ) : (
            data?.host?.hostTransactionsReports?.nodes.slice(offset, offset + limit).map(n => {
              const timeUnit = data.host.hostTransactionsReports.timeUnit;
              const period = {
                dateFrom: dayjs.utc(n.date).startOf(timeUnit).toISOString(),
                dateTo: dayjs.utc(n.date).endOf(timeUnit).toISOString(),
                timeUnit,
              };
              const reportSlug = serializeReportSlug(period);

              return (
                <Link
                  href={`/dashboard/${account.slug}/reports/${reportSlug}`}
                  className="flex items-center justify-between gap-2 p-4 text-sm font-medium hover:bg-muted"
                  key={reportSlug}
                >
                  <span className="flex items-center gap-2">
                    {renderReportPeriodLabel(period)}
                    <CurrentPeriodBadge variables={period} />
                  </span>

                  <div className="grid w-[400px] grid-cols-2 text-right font-normal text-muted-foreground">
                    <div>
                      {n.managedFunds.totalChange.valueInCents > 0 && '+'}
                      <FormattedMoneyAmount
                        amount={n.managedFunds.totalChange.valueInCents}
                        currency={n.managedFunds.totalChange.currency}
                        amountStyles={{ letterSpacing: 0 }}
                        showCurrencyCode={false}
                      />
                    </div>
                    <div>
                      {n.operationalFunds.totalChange.valueInCents > 0 && '+'}
                      <FormattedMoneyAmount
                        amount={n.operationalFunds.totalChange.valueInCents}
                        currency={n.operationalFunds.totalChange.currency}
                        amountStyles={{ letterSpacing: 0 }}
                        showCurrencyCode={false}
                      />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {pages > 1 && (
        <Pagination
          totalPages={pages}
          page={currentPage}
          onChange={page => queryFilter.setFilter('offset', (page - 1) * limit)}
        />
      )}
    </div>
  );
};

export default HostTransactionReportList;
