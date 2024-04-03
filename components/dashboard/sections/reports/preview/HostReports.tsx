import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import clsx from 'clsx';
import { FlaskConical, MoreVertical } from 'lucide-react';
// Using Next.js Link directly, as components/Link currently does not handle refs
// eslint-disable-next-line no-restricted-imports
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import dayjs from '../../../../../lib/dayjs';
import { FilterComponentConfigs, FiltersToVariables } from '../../../../../lib/filters/filter-types';
import { boolean } from '../../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../../lib/graphql/helpers';
import { Host, HostReportsPageQueryVariables } from '../../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../../lib/hooks/useQueryFilter';
import { i18nReportSection } from '../../../../../lib/i18n/reports';

import FormattedMoneyAmount from '../../../../FormattedMoneyAmount';
import Loading from '../../../../Loading';
import MessageBoxGraphqlError from '../../../../MessageBoxGraphqlError';
import { Button } from '../../../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../ui/DropdownMenu';
import { Label } from '../../../../ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../ui/Popover';
import { RadioGroup, RadioGroupItem } from '../../../../ui/RadioGroup';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../ui/Tooltip';
import { DashboardContext } from '../../../DashboardContext';
import DashboardHeader from '../../../DashboardHeader';
import { Filterbar } from '../../../filters/Filterbar';
import { DashboardSectionProps } from '../../../types';

import { buildReportGroups, filterToTransactionsQuery } from './helpers';
import { periodFilter } from './ReportPeriodFilter';

const schema = z.object({
  period: periodFilter.schema,
  isHost: boolean.default(false),
});

type FilterValues = z.infer<typeof schema>;

type FilterMeta = {
  hostCreatedAt: Host['createdAt'];
};

const toVariables: FiltersToVariables<FilterValues, HostReportsPageQueryVariables, FilterMeta> = {
  period: periodFilter.toVariables,
};
const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  // @ts-ignore need to modify FilerComponentConfig to use the input (z.input) value as the accepted value in the onChange function, instead of the resulting type after zod transforms (z.infer)
  period: periodFilter.filter,
};

const hostReportQuery = gql`
  query HostReports($hostSlug: String!, $dateTo: DateTime, $dateFrom: DateTime) {
    host(slug: $hostSlug) {
      id
      currency
      stats {
        hostStartingBalance: balance(dateTo: $dateFrom, includeChildren: true) {
          valueInCents
          currency
        }
      }
      startingHostMetrics: hostMetrics(dateTo: $dateFrom) {
        totalMoneyManaged {
          valueInCents
          currency
        }
      }
      transactionsReport(dateFrom: $dateFrom, dateTo: $dateTo) {
        amount {
          valueInCents
          currency
        }
        kind
        isHost
        type
        expenseType
        isRefund
      }
    }
  }
`;

enum TestLayout {
  DEBITCREDIT = 'debitcredit',
  AMOUNT = 'amount',
}

const HostDashboardReports = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const { account } = React.useContext(DashboardContext);
  const intl = useIntl();
  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    meta: {
      hostCreatedAt: account.createdAt,
    },
  });

  const [layout, setLayout] = React.useState(TestLayout.AMOUNT);

  const { loading, error, data } = useQuery(hostReportQuery, {
    variables: {
      hostSlug,
      ...queryFilter.variables,
    },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-first',
  });

  const showCreditDebit = layout === TestLayout.DEBITCREDIT;

  const reportGroups = buildReportGroups(data, { showCreditDebit });
  const hostStartingBalance = data?.host?.stats?.hostStartingBalance?.valueInCents;
  const managedFundsStartingBalance =
    data?.host?.startingHostMetrics?.totalMoneyManaged?.valueInCents - hostStartingBalance;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="Reports" defaultMessage="Reports" />}
        actions={
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon-sm" variant="outline">
                  <FlaskConical size={18} />
                </Button>
              </PopoverTrigger>

              <PopoverContent align="end" sideOffset={8}>
                <div className="flex flex-col gap-4">
                  <RadioGroup defaultValue={layout} onValueChange={(value: TestLayout) => setLayout(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={TestLayout.AMOUNT} id={TestLayout.AMOUNT} />
                      <Label htmlFor={TestLayout.AMOUNT}>Amount column</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={TestLayout.DEBITCREDIT} id={TestLayout.DEBITCREDIT} />
                      <Label htmlFor={TestLayout.DEBITCREDIT}>Debit/credit columns</Label>
                    </div>
                  </RadioGroup>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        }
      />

      <Filterbar hideSeparator {...queryFilter} />

      <div className="space-y-6">
        {loading ? (
          <Loading />
        ) : error ? (
          <MessageBoxGraphqlError error={error} />
        ) : (
          <div className="space-y-16 rounded-xl border p-6 sm:p-12">
            <div className="-m-6 grid grid-cols-2 divide-x rounded-t-xl bg-muted sm:-mx-12 sm:-mt-12">
              <button
                onClick={() => queryFilter.setFilter('isHost', false)}
                className={clsx(
                  'rounded-tl-xl border-b px-6 py-4 text-left ring-ring transition-colors focus:outline-none focus-visible:ring-2 sm:px-12 sm:pb-8 sm:pt-10',
                  !queryFilter.values.isHost ? 'border-b-transparent bg-white' : 'hover:bg-slate-50',
                )}
              >
                <div className="text-lg font-semibold sm:text-2xl">
                  <FormattedMessage defaultMessage="Managed funds" />
                </div>
                <div className="text-xs text-muted-foreground sm:text-sm">
                  <FormattedMessage defaultMessage="Funds going to and from Hosted Collective accounts" />
                </div>
              </button>
              <button
                onClick={() => queryFilter.setFilter('isHost', true)}
                className={clsx(
                  'rounded-tr-xl border-b px-6 py-4 text-left ring-ring transition-colors focus:outline-none focus-visible:ring-2 sm:px-12 sm:pb-8 sm:pt-10',
                  queryFilter.values.isHost ? ' border-b-transparent bg-white' : 'hover:bg-slate-50',
                )}
              >
                <div className="text-lg font-semibold sm:text-2xl">
                  <FormattedMessage defaultMessage="Operational funds" />
                </div>
                <div className="text-xs text-muted-foreground sm:text-sm">
                  <FormattedMessage defaultMessage="Funds going to and from the Fiscal Host account" />
                </div>
              </button>
            </div>
            {reportGroups
              .filter(g => g.filter.isHost === queryFilter.values.isHost)
              .map(report => {
                const startingBalance = report.filter.isHost ? hostStartingBalance : managedFundsStartingBalance;
                const endingBalance = startingBalance + report.total;

                return (
                  <div key={report.label} className="space-y-6">
                    {/* <hr /> */}
                    <div className="flex flex-col gap-4 px-0">
                      {report.parts.map(section => (
                        <div key={section.label} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-base font-medium">{i18nReportSection(intl, section.label)}</div>
                          </div>
                          <hr />
                          <div className="flex flex-col gap-0">
                            {section.parts.map(subPart => {
                              const creditAmount = subPart.groups.reduce(
                                (acc, t) => (t.type === 'CREDIT' ? acc + t.amount.valueInCents : acc),
                                0,
                              );
                              const debitAmount = subPart.groups.reduce(
                                (acc, t) => (t.type === 'DEBIT' ? acc + t.amount.valueInCents : acc),
                                0,
                              );
                              return (
                                <div
                                  key={JSON.stringify(subPart.filter)}
                                  className="group relative -mx-6 flex justify-between gap-3 py-1 pl-6 pr-3 text-sm hover:bg-muted has-[[data-state=open]]:bg-muted sm:-mx-12 sm:pl-12 sm:pr-6"
                                >
                                  <div className="flex flex-1 items-center gap-1 overflow-hidden truncate text-wrap text-left">
                                    <Tooltip>
                                      <TooltipTrigger className="cursor-help text-left">
                                        <span className="underline decoration-slate-300 decoration-dashed underline-offset-2 transition-colors hover:decoration-slate-400">
                                          {subPart.label}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-96">
                                        <div className="block break-keep font-mono">
                                          {/* NOTE: This tooltip and its content is only for development/testing purposes. 
                                        TODO: Include a more helpful message, or proper formatting of filters, for the general release */}
                                          {JSON.stringify(subPart.filter, null, 2)}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <div className="flex shrink-0 items-center justify-end gap-0">
                                    {showCreditDebit ? (
                                      <div className="grid grid-cols-2 gap-4 text-right">
                                        <div className="w-40 font-medium">
                                          {debitAmount !== 0 && (
                                            <FormattedMoneyAmount
                                              amountStyles={{ letterSpacing: 0 }}
                                              amount={Math.abs(debitAmount)}
                                              currency={data?.host?.currency}
                                              showCurrencyCode={false}
                                            />
                                          )}
                                        </div>
                                        <div className="w-40 font-medium">
                                          {creditAmount !== 0 && (
                                            <FormattedMoneyAmount
                                              amountStyles={{ letterSpacing: 0 }}
                                              amount={Math.abs(creditAmount)}
                                              currency={data?.host?.currency}
                                              showCurrencyCode={false}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="font-medium">
                                        <FormattedMoneyAmount
                                          amountStyles={{ letterSpacing: 0 }}
                                          amount={subPart.amount}
                                          currency={data?.host?.currency}
                                          showCurrencyCode={false}
                                        />
                                      </div>
                                    )}

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon-xs"
                                          className="relative left-2 size-6 text-slate-400 transition-colors group-hover:border group-hover:bg-background group-hover:text-muted-foreground data-[state=open]:border data-[state=open]:bg-background"
                                        >
                                          <MoreVertical size={16} />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                          <Link
                                            href={{
                                              pathname: `/dashboard/${hostSlug}/host-transactions`,
                                              query: filterToTransactionsQuery(
                                                hostSlug,
                                                subPart.filter,
                                                queryFilter.values,
                                              ),
                                            }}
                                          >
                                            <FormattedMessage defaultMessage="View transactions" />
                                          </Link>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <hr />

                          <div className="flex justify-end text-base font-medium">
                            <FormattedMoneyAmount
                              amount={section.total}
                              currency={data?.host?.currency}
                              showCurrencyCode={false}
                              amountStyles={{ letterSpacing: 0 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* <hr /> */}
                    <div className="-mx-6 space-y-3 bg-muted p-6 sm:-mx-6 sm:rounded-xl">
                      <div className="flex justify-between text-base font-medium">
                        <div>
                          <FormattedMessage
                            defaultMessage="Starting balance {date}"
                            values={{
                              date: (
                                <span className="border-b border-dashed border-muted-foreground">
                                  {dayjs(queryFilter.values.period.gt).utc().format('D MMM, YYYY')} (UTC)
                                </span>
                              ),
                            }}
                          />
                        </div>

                        <FormattedMoneyAmount
                          amountStyles={{ letterSpacing: 0 }}
                          amount={startingBalance}
                          currency={data?.host?.currency}
                          showCurrencyCode={false}
                        />
                      </div>
                      <div className="flex justify-between text-base font-medium">
                        <div>
                          <FormattedMessage defaultMessage="Total change" />
                        </div>

                        <FormattedMoneyAmount
                          amountStyles={{ letterSpacing: 0 }}
                          amount={report.total}
                          currency={data?.host?.currency}
                          showCurrencyCode={false}
                        />
                      </div>
                      {/* <hr /> */}
                      <div className="flex justify-between text-base font-medium">
                        <div>
                          <FormattedMessage
                            defaultMessage="Ending balance {date}"
                            values={{
                              date: (
                                <span className="border-b border-dashed border-muted-foreground">
                                  {dayjs(queryFilter.values.period.lt).utc().format('D MMM, YYYY')} (UTC)
                                </span>
                              ),
                            }}
                          />
                        </div>

                        <FormattedMoneyAmount
                          amountStyles={{ letterSpacing: 0 }}
                          amount={endingBalance}
                          currency={data?.host?.currency}
                          showCurrencyCode={false}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

HostDashboardReports.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default HostDashboardReports;
