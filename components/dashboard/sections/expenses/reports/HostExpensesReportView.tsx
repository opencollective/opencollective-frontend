import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { orderBy, sumBy } from 'lodash';
import { MoreVertical } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { boolean } from '../../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../../lib/graphql/helpers';
import {
  type HostExpensesReportQuery,
  type HostExpensesReportQueryVariables,
} from '../../../../../lib/graphql/types/v2/graphql';
import { ExpenseStatus } from '../../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../../lib/hooks/useQueryFilter';

import FormattedMoneyAmount from '../../../../FormattedMoneyAmount';
import Link from '../../../../Link';
import Loading from '../../../../Loading';
import MessageBoxGraphqlError from '../../../../MessageBoxGraphqlError';
import { Button } from '../../../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../ui/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../ui/Tooltip';
import DashboardHeader from '../../../DashboardHeader';
import { UNCATEGORIZED_VALUE } from '../../../filters/AccountingCategoryFilter';
import type { DashboardSectionProps } from '../../../types';
import { HostExpensesReportTabs } from '../../reports/HostReportTabs';
import { ReportNavigationArrows } from '../../reports/NavigationArrows';
import { deserializeReportSlug, ReportPeriodSelector } from '../../reports/ReportPeriodSelector';

const schema = z.object({
  isHost: boolean.default(false),
});

export function HostExpensesReportView(props: DashboardSectionProps) {
  const variables = deserializeReportSlug(props.subpath[0]);

  const intl = useIntl();

  const query = useQuery<HostExpensesReportQuery, HostExpensesReportQueryVariables>(
    gql`
      query HostExpensesReport($accountSlug: String!, $timeUnit: TimeUnit, $dateFrom: DateTime, $dateTo: DateTime) {
        host(slug: $accountSlug) {
          createdAt
          currency
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
              accountingCategory {
                id
                code
                name
                friendlyName
              }
            }
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        accountSlug: props.accountSlug,
        ...variables,
      },
    },
  );

  const queryFilter = useQueryFilter({
    schema,
    filters: {},
  });

  const navigateToReport = reportSlug => {
    queryFilter.setFilters({}, `/dashboard/${props.accountSlug}/reports/expenses/${reportSlug}`);
  };

  const { loading, error } = query;

  const data = React.useMemo(() => {
    if (!query.data?.host?.hostExpensesReport?.nodes) {
      return [];
    }

    const values = query.data?.host?.hostExpensesReport?.nodes.filter(item =>
      queryFilter.values.isHost ? item.isHost : !item.isHost,
    );

    return orderBy(values, v => v.accountingCategory?.code || '');
  }, [query.data?.host?.hostExpensesReport?.nodes, queryFilter.values.isHost]);

  const totalAmount = sumBy(data, 'amount.valueInCents');
  const totalCount = sumBy(data, 'count');
  const currency = query.data?.host?.currency;

  return (
    <React.Fragment>
      <div className="flex max-w-(--breakpoint-lg) flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage defaultMessage="Expense Reports" id="qC0ZXX" />}
          titleRoute={`/dashboard/${props.accountSlug}/reports/expenses`}
          subpathTitle={
            <ReportPeriodSelector
              value={props.subpath[0]}
              onChange={navigateToReport}
              meta={{
                hostCreatedAt: query.data?.host?.createdAt,
              }}
              intl={intl}
            />
          }
          actions={
            <div className="flex items-center gap-2">
              <ReportNavigationArrows variables={variables} onChange={navigateToReport} />
            </div>
          }
        />

        <div className="space-y-6">
          {loading ? (
            <Loading />
          ) : error ? (
            <MessageBoxGraphqlError error={error} />
          ) : (
            <div className="space-y-10 overflow-hidden rounded-xl border pb-4">
              <HostExpensesReportTabs queryFilter={queryFilter} />

              <div className="flex flex-col">
                <table className="border-none">
                  <tbody>
                    {data.map((item, i) => {
                      const url = new URL(
                        item.isHost
                          ? `/dashboard/${props.accountSlug}/expenses`
                          : `/dashboard/${props.accountSlug}/host-expenses`,
                        window.location.href,
                      );

                      url.searchParams.set('accountingCategory', item.accountingCategory?.code || UNCATEGORIZED_VALUE);
                      url.searchParams.set('status', ExpenseStatus.PAID);
                      url.searchParams.set('sort[field]', 'CREATED_AT');
                      url.searchParams.set('sort[direction]', 'DESC');
                      if (variables.dateFrom && variables.dateTo) {
                        url.searchParams.set('date[type]', 'BETWEEN');
                        url.searchParams.set('date[gte]', variables.dateFrom.slice(0, 10));
                        url.searchParams.set('date[lte]', variables.dateTo.slice(0, 10));
                      }

                      return (
                        // eslint-disable-next-line react/no-array-index-key
                        <tr key={i} className="group border-b text-sm hover:bg-muted has-data-[state=open]:bg-muted">
                          <td className="flex min-h-8 flex-1 items-center gap-1 truncate overflow-hidden py-1 pl-6 text-left text-wrap sm:pl-10">
                            <AccountingCategoryLabel accountingCategory={item.accountingCategory} />
                            <Tooltip delayDuration={100}>
                              <TooltipTrigger asChild>
                                <div className="text-xs text-slate-400">({item.count})</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <FormattedMessage
                                  defaultMessage="{n, plural, one {1 expense} other {{n} expenses}}"
                                  id="xyYeS2"
                                  values={{ n: item.count }}
                                />
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="pr-6 text-right font-medium">
                            <div className="inline-flex gap-1">
                              <FormattedMoneyAmount
                                amount={item.amount.valueInCents}
                                currency={item.amount.currency}
                                showCurrencyCode={false}
                              />
                            </div>
                          </td>
                          <td className="pr-1 text-right sm:pr-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="relative size-6 text-slate-400 transition-colors group-hover:border group-hover:bg-background group-hover:text-muted-foreground data-[state=open]:border data-[state=open]:bg-background"
                                >
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Link href={url.toString()} openInNewTab>
                                    <FormattedMessage defaultMessage="View expenses" id="rZDjnQ" />
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="py-4">
                    <tr>
                      <td className="flex min-h-8 flex-1 items-center gap-1 truncate overflow-hidden py-1 pl-6 text-left text-wrap sm:pl-10">
                        <FormattedMessage defaultMessage="Total" id="MJ2jZQ" />
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-slate-400">({totalCount})</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <FormattedMessage
                              defaultMessage="{n, plural, one {1 expense} other {{n} expenses}}"
                              id="xyYeS2"
                              values={{ n: totalCount }}
                            />
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="pr-6 text-right font-medium">
                        <FormattedMoneyAmount amount={totalAmount} currency={currency} showCurrencyCode={false} />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

type AccountingCategoryLabelProps = {
  accountingCategory: HostExpensesReportQuery['host']['hostExpensesReport']['nodes'][number]['accountingCategory'];
};

function AccountingCategoryLabel(props: AccountingCategoryLabelProps) {
  if (!props.accountingCategory) {
    return <FormattedMessage defaultMessage="Uncategorized" id="iO050q" />;
  }

  return `${props.accountingCategory.code} - ${props.accountingCategory.name}`;
}
