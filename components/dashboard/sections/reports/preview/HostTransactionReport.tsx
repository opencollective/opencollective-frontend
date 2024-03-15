import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import clsx from 'clsx';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CornerDownRight,
  FlaskConical,
  Megaphone,
  MoreVertical,
} from 'lucide-react';
// Using Next.js Link directly, as components/Link currently does not handle refs
// eslint-disable-next-line no-restricted-imports
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { Badge } from '../../../../ui/Badge';
import dayjs from '../../../../../lib/dayjs';
import { FilterComponentConfigs, FiltersToVariables } from '../../../../../lib/filters/filter-types';
import { boolean, integer } from '../../../../../lib/filters/schemas';
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
import { buildReportGroups, buildReportGroupsV2, filterToTransactionsQuery, isCurrentPeriod } from './helpers';
import {
  periodFilter,
  renderReportPeriodLabel,
  deserializeReportSlug,
  ReportPeriodSelector,
  serializeReportSlug,
} from './ReportPeriodSelector';
import Tabs from '../../../../Tabs';
import { Pagination } from '../../../../ui/Pagination';
import { Skeleton } from '../../../../ui/Skeleton';
import { toNumber } from 'lodash';
import { InfoTooltipIcon } from '../../../../InfoTooltipIcon';
import { hostReportQuery } from './queries';
import {
  i18nTransactionReportRowLabel,
  i18nTransactionReportRowLabelDynamic,
} from '../../../../../lib/i18n/transaction-reports';

import { TransactionReportRowLabel } from './TransactionRowLabel';
import { useRouter } from 'next/router';
import MessageBox from '../../../../MessageBox';
import { ReportNavigationArrows } from './NavigationArrows';
import { FEEDBACK_KEY, FeedbackModal } from '../../../../FeedbackModal';
import { DefinitionTooltip } from './DefinitionTooltip';
import { HostReportTabs } from './HostReportTabs';
const schema = z.object({
  // subpath: periodFilter.schema.optional(),
  // subpath: z.string().optional(),
  // subpath: z.coerce.string().nullable().default(null), // default null makes sure to always trigger the `toVariables` function
  isHost: boolean.default(false),
  algorithmic: boolean.default(false),
});

type FilterValues = z.infer<typeof schema>;

type FilterMeta = {
  hostCreatedAt: Host['createdAt'];
};

// const toVariables: FiltersToVariables<FilterValues, HostReportsPageQueryVariables, FilterMeta> = {
//   // subpath: periodFilter.toVariables,
// };
const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  // @ts-ignore need to modify FilerComponentConfig to use the input (z.input) value as the accepted value in the onChange function, instead of the resulting type after zod transforms (z.infer)
  // subpath: periodFilter.filter,
};

enum TestLayout {
  DEBITCREDIT = 'debitcredit',
  AMOUNT = 'amount',
}

const PreviewFeatureConfigButton = ({ layout, setLayout }) => {
  const [feedbackModalOpen, setFeedbackModalOpen] = React.useState(false);

  React.useEffect(() => {
    const localStorageLayout = localStorage.getItem('host-reports-layout');
    if (localStorageLayout) {
      setLayout(localStorageLayout as TestLayout);
    }
  }, []);
  React.useEffect(() => {
    localStorage.setItem('host-reports-layout', layout);
  }, [layout]);

  return (
    <React.Fragment>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button size="icon-sm" variant="outline">
                <FlaskConical size={18} />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>

          <TooltipContent side="bottom">Configure preview feature</TooltipContent>
        </Tooltip>
        <PopoverContent align="end" sideOffset={8}>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Configure layout</h4>
              <p className="text-sm text-muted-foreground">
                {"We're testing layout options, please let us know what you prefer!"}
              </p>
            </div>

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
            <Button variant="outline" className="gap-2" onClick={() => setFeedbackModalOpen(true)}>
              <Megaphone size={16} /> Give feedback
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <FeedbackModal
        title={<FormattedMessage defaultMessage="Give feedback on the new Host Transactions Report" />}
        feedbackKey={FEEDBACK_KEY.HOST_REPORTS}
        open={feedbackModalOpen}
        setOpen={setFeedbackModalOpen}
      />
    </React.Fragment>
  );
};

const HostTransactionReport = ({ accountSlug: hostSlug, subpath }: DashboardSectionProps) => {
  // console.log({ reportKey });
  const variables = deserializeReportSlug(subpath[0]);
  // const variables = {
  //   dateFrom: '2024-01-01',
  //   dateTo: '2024-01-31',
  //   timeUnit: 'MONTH',
  // };
  const { account } = React.useContext(DashboardContext);
  const intl = useIntl();
  const queryFilter = useQueryFilter({
    filters,
    schema,
    // toVariables,
    meta: {
      hostCreatedAt: account.createdAt,
    },
  });
  const router = useRouter();
  console.log({ router, queryFilter });

  const [layout, setLayout] = React.useState(TestLayout.AMOUNT);

  const { loading, error, data } = useQuery(hostReportQuery, {
    variables: {
      hostSlug,
      ...variables,
      includeGroups: true,
    },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-first',
  });

  const showCreditDebit = layout === TestLayout.DEBITCREDIT;

  const report = data?.host?.hostTransactionsReports?.nodes[0];
  const currentSection = queryFilter.values.isHost ? report?.operationalFunds : report?.managedFunds;

  const reportGroups = buildReportGroups(currentSection?.groups, {
    showCreditDebit,
    filter: { isHost: queryFilter.values.isHost },
    useSimpleLayout: queryFilter.values.algorithmic,
  });
  const startingBalance = currentSection?.startingBalance.valueInCents;

  if (!variables) {
    return (
      <MessageBox withIcon type="error">
        <FormattedMessage defaultMessage="Report can't be found." />
      </MessageBox>
    );
  }
  const onChange = reportSlug => {
    queryFilter.setFilters({}, `/dashboard/${hostSlug}/reports/${reportSlug}`);
  };
  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="Reports" defaultMessage="Reports" />}
        titleRoute={`/dashboard/${hostSlug}/reports`}
        subpathTitle={
          <ReportPeriodSelector value={subpath[0]} onChange={onChange} meta={queryFilter.meta} intl={intl} />
        }
        actions={
          <div className="flex items-center gap-2">
            <ReportNavigationArrows variables={variables} onChange={onChange} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  Export <ChevronDown size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Export transactions</DropdownMenuItem>
                <DropdownMenuItem>Export report CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <PreviewFeatureConfigButton layout={layout} setLayout={setLayout} />
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
            <HostReportTabs queryFilter={queryFilter} report={report} />

            <div className="space-y-6">
              <div className="flex flex-col gap-4 px-0">
                {reportGroups?.parts?.map(section => (
                  <div key={section.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2 px-4 sm:px-10">
                      <div className="text-base font-medium">{i18nReportSection(intl, section.label)}</div>
                    </div>
                    <hr className="mx-4 sm:mx-10" />
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

                        const withDecoration = false;

                        const legacySubparts = [
                          {
                            newKind: 'HOST_FEE_SHARE',
                            helpLabel:
                              'As of 2021-06-01 platform shares are split into their own transaction kind. This value is represented in the transactions above.',
                            amount: subPart.platformFee,
                          },
                          {
                            newKind: 'PAYMENT_PROCESSOR_FEE',
                            helpLabel:
                              'As of 2024-01-01 payment processor fees are split into their own transaction kind. This value is represented in the transactions above.',
                            amount: subPart.paymentProcessorFee,
                          },
                          {
                            newKind: 'HOST_FEE',
                            helpLabel:
                              'As of 2021-06-01 host fees are split into their own transaction kind. This value is represented in the transactions above.',
                            amount: subPart.hostFee,
                          },
                          {
                            newKind: 'TAX',
                            helpLabel:
                              'As of 2024-01-01 taxes are split into their own transaction kind. This value is represented in the transactions above.',
                            amount: subPart.taxAmount,
                          },
                        ];

                        const displayedLegacyParts = legacySubparts.filter(sp => sp.amount !== 0);
                        return (
                          <React.Fragment key={JSON.stringify(subPart.filter)}>
                            <div className="group relative flex justify-between gap-3 py-1 pl-6 pr-3 text-sm hover:bg-muted has-[[data-state=open]]:bg-muted sm:pl-10 sm:pr-4">
                              <div className="flex flex-1 items-center gap-1 overflow-hidden truncate text-wrap text-left">
                                {withDecoration ? (
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
                                ) : (
                                  <span className="underline-offset-2 transition-colors hover:decoration-slate-400">
                                    {subPart.label || <TransactionReportRowLabel filter={subPart.filter} />}
                                  </span>
                                )}
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
                                          query: filterToTransactionsQuery(hostSlug, subPart.filter, variables),
                                        }}
                                      >
                                        <FormattedMessage defaultMessage="View transactions" />
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Export transactions</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            {displayedLegacyParts.map(legacyPart => (
                              <div
                                key={`legacy-${legacyPart.newKind}`}
                                className="group relative flex justify-between gap-3 py-1 pl-6 pr-3 text-sm hover:bg-muted has-[[data-state=open]]:bg-muted sm:pl-10 sm:pr-4"
                              >
                                <div className="ml-2 flex items-center gap-1 text-muted-foreground">
                                  <CornerDownRight size={14} />
                                  {i18nTransactionReportRowLabel(intl, legacyPart.newKind, subPart.filter.isRefund)}
                                </div>
                                <div className="flex shrink-0 items-center justify-end gap-2">
                                  <div className="font-medium">
                                    <FormattedMoneyAmount
                                      amount={legacyPart.amount}
                                      amountStyles={{ letterSpacing: 0 }}
                                      currency={data?.host?.currency}
                                      showCurrencyCode={false}
                                    />
                                  </div>
                                  <InfoTooltipIcon className="relative left-1 text-slate-400 group-hover:text-muted-foreground">
                                    {legacyPart.helpLabel}
                                  </InfoTooltipIcon>
                                </div>
                              </div>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <div className="space-y-1 px-4 sm:px-10">
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
                  </div>
                ))}
              </div>
              <div className="mx-4 space-y-3 bg-muted p-6 sm:rounded-xl">
                <div className="flex justify-between text-base font-medium">
                  <div>
                    <FormattedMessage
                      defaultMessage="Starting balance {date}"
                      values={{
                        date: (
                          <DefinitionTooltip
                            definition={
                              <FormattedMessage defaultMessage="This report is currently only available in UTC" />
                            }
                          >
                            {dayjs(variables.dateFrom).utc().format('D MMM, YYYY')} (UTC)
                          </DefinitionTooltip>
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
                    <FormattedMessage defaultMessage="Net change" />
                  </div>

                  <FormattedMoneyAmount
                    amountStyles={{ letterSpacing: 0 }}
                    amount={currentSection?.totalChange.valueInCents}
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
                          <DefinitionTooltip
                            definition={
                              <FormattedMessage defaultMessage="This report is currently only available in UTC" />
                            }
                          >
                            {dayjs(variables.dateTo).utc().format('D MMM, YYYY')} (UTC)
                          </DefinitionTooltip>
                        ),
                      }}
                    />
                  </div>

                  <FormattedMoneyAmount
                    amountStyles={{ letterSpacing: 0 }}
                    amount={currentSection?.endingBalance.valueInCents}
                    currency={data?.host?.currency}
                    showCurrencyCode={false}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostTransactionReport;
