import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { toNumber } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import dayjs from '../../../../../lib/dayjs';
import { integer } from '../../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../../lib/hooks/useQueryFilter';

import { DataTable } from '../../../../DataTable';
import FormattedMoneyAmount from '../../../../FormattedMoneyAmount';
import MessageBoxGraphqlError from '../../../../MessageBoxGraphqlError';
import Tabs from '../../../../Tabs';
import { Pagination } from '../../../../ui/Pagination';
import { DashboardContext } from '../../../DashboardContext';
import DashboardHeader from '../../../DashboardHeader';
import { DashboardSectionProps } from '../../../types';

import { CurrentPeriodBadge } from './CurrentPeriodBadge';
import { hostReportQuery } from './queries';
import { renderReportPeriodLabel, serializeReportSlug } from './ReportPeriodSelector';

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

  const tabs = useMemo(
    () => [
      { id: 'MONTH', label: intl.formatMessage({ id: 'Frequency.Monthly', defaultMessage: 'Monthly' }) },
      { id: 'QUARTER', label: intl.formatMessage({ id: 'quarter', defaultMessage: 'Quarterly' }) },
      { id: 'YEAR', label: intl.formatMessage({ id: 'Frequency.Yearly', defaultMessage: 'Yearly' }) },
    ],
    [intl],
  );

  const onChange = useCallback(
    id => {
      queryFilter.setFilters({ timeUnit: id, offset: 0 });
    },
    [queryFilter],
  );

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="Reports" defaultMessage="Reports" />}
        actions={<div className="flex items-center gap-2"></div>}
      />

      <Tabs selectedId={queryFilter.values.timeUnit} onChange={onChange} tabs={tabs} />

      <div>
        <div>
          {error ? (
            <MessageBoxGraphqlError error={error} />
          ) : (
            <DataTable
              innerClassName="table-fixed"
              columns={columns}
              loading={loading}
              mobileTableView
              nbPlaceholders={queryFilter.values.limit}
              onClickRow={row => {
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

                return {
                  period,
                  managedFundsTotalChange: n.managedFunds.totalChange,
                  operationalFundsTotalChange: n.operationalFunds.totalChange,
                };
              })}
            />
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
