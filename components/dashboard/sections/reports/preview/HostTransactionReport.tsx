import React, { Fragment } from 'react';
import { useQuery } from '@apollo/client';
import { ChevronDown, FlaskConical, Megaphone, MoreVertical } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import dayjs from '../../../../../lib/dayjs';
import { boolean } from '../../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../../lib/hooks/useQueryFilter';
import { i18nReportSection } from '../../../../../lib/i18n/reports';

import { FEEDBACK_KEY, FeedbackModal } from '../../../../FeedbackModal';
import FormattedMoneyAmount from '../../../../FormattedMoneyAmount';
import Loading from '../../../../Loading';
import MessageBox from '../../../../MessageBox';
import MessageBoxGraphqlError from '../../../../MessageBoxGraphqlError';
import { Button } from '../../../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../ui/DropdownMenu';
import { Label } from '../../../../ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../ui/Popover';
import { RadioGroup, RadioGroupItem } from '../../../../ui/RadioGroup';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../ui/Tooltip';
import { DashboardContext } from '../../../DashboardContext';
import DashboardHeader from '../../../DashboardHeader';
import ExportTransactionsCSVModal from '../../../ExportTransactionsCSVModal';
import { DashboardSectionProps } from '../../../types';
import {
  schema as hostTransactionsSchema,
  toVariables as hostTransactionsToVariables,
} from '../../transactions/HostTransactions';

import { buildReport } from './report-builder/build-report';
import { DefinitionTooltip } from './DefinitionTooltip';
import { filterToTransactionsFilterValues } from './helpers';
import { HostReportTabs } from './HostReportTabs';
import { LegacyColumnRows } from './LegacyColumnRows';
import { ReportNavigationArrows } from './NavigationArrows';
import { hostReportQuery } from './queries';
import { deserializeReportSlug, ReportPeriodSelector } from './ReportPeriodSelector';
import { TransactionReportRowLabel } from './TransactionRowLabel';
import { GroupFilter } from './types';

const schema = z.object({
  isHost: boolean.default(false),
  computational: boolean.default(false),
});

enum TestLayout {
  DEBITCREDIT = 'debitcredit',
  AMOUNT = 'amount',
}

const HostTransactionReport = ({ accountSlug: hostSlug, subpath }: DashboardSectionProps) => {
  const variables = deserializeReportSlug(subpath[0]);

  const { account } = React.useContext(DashboardContext);
  const intl = useIntl();
  const queryFilter = useQueryFilter({
    filters: {},
    schema,
    meta: {
      hostCreatedAt: account.createdAt,
    },
  });

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

  const [displayExportCSVModal, setDisplayExportCSVModal] = React.useState(false);

  // Query filter for the export transactions modal and for linking to the host transactions page with filters applied
  const hostTransactionsQueryFilter = useQueryFilter({
    schema: hostTransactionsSchema,
    toVariables: hostTransactionsToVariables,
    filters: {},
    skipRouter: true, // we don't want to update the URL (already done by the main query filter)
  });

  const openExportTransactionsModal = (rowFilter: GroupFilter = {}) => {
    const transactionsFilters = filterToTransactionsFilterValues(hostSlug, rowFilter, variables);
    hostTransactionsQueryFilter.resetFilters(transactionsFilters);
    setDisplayExportCSVModal(true);
  };

  const viewTransactions = (rowFilter: GroupFilter = {}) => {
    const transactionsFilters = filterToTransactionsFilterValues(hostSlug, rowFilter, variables);
    hostTransactionsQueryFilter.resetFilters(transactionsFilters, `/dashboard/${hostSlug}/host-transactions`);
  };

  const showCreditDebit = layout === TestLayout.DEBITCREDIT;
  const report = data?.host?.hostTransactionsReports?.nodes[0];
  const currentSection = queryFilter.values.isHost ? report?.operationalFunds : report?.managedFunds;

  const reportSections = buildReport(currentSection?.groups, {
    filter: { isHost: queryFilter.values.isHost },
    showCreditDebit,
    useComputationalLayout: queryFilter.values.computational,
  });
  const startingBalance = currentSection?.startingBalance.valueInCents;

  if (!variables) {
    return (
      <MessageBox withIcon type="error">
        <FormattedMessage defaultMessage="Report can't be found." />
      </MessageBox>
    );
  }
  const navigateToReport = reportSlug => {
    // Updating the URL without changing any filters (e.g. isHost that controls selected tab)
    queryFilter.setFilters({}, `/dashboard/${hostSlug}/reports/${reportSlug}`);
  };
  return (
    <Fragment>
      <div className="flex max-w-screen-lg flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage id="Reports" defaultMessage="Reports" />}
          titleRoute={`/dashboard/${hostSlug}/reports`}
          subpathTitle={
            <ReportPeriodSelector value={subpath[0]} onChange={navigateToReport} meta={queryFilter.meta} intl={intl} />
          }
          actions={
            <div className="flex items-center gap-2">
              <ReportNavigationArrows variables={variables} onChange={navigateToReport} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <FormattedMessage id="editCollective.menu.export" defaultMessage="Export" />{' '}
                    <ChevronDown size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => openExportTransactionsModal()}>
                    <FormattedMessage defaultMessage="Export transactions" />
                  </DropdownMenuItem>
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
                  {reportSections?.length === 0 && (
                    <p className="p-4 text-center text-muted-foreground">
                      <FormattedMessage defaultMessage="No transactions this period " />
                    </p>
                  )}
                  {reportSections?.map(section => (
                    <table key={section.label} className="border-none">
                      <thead className="relative border-b">
                        <tr>
                          <th className="py-1 pl-6 text-left text-base font-medium sm:pl-10">
                            {i18nReportSection(intl, section.label)}
                          </th>
                          {showCreditDebit ? (
                            <React.Fragment>
                              <th className="w-40  text-right text-sm font-medium text-muted-foreground">
                                <FormattedMessage id="Expense.Type.Debit" defaultMessage="Debit" />
                              </th>
                              <th className="w-40 text-right text-sm font-medium text-muted-foreground">
                                <FormattedMessage id="Transaction.Type.Credit" defaultMessage="Credit" />
                              </th>
                            </React.Fragment>
                          ) : (
                            <th></th>
                          )}
                          <th className="w-6 sm:w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map(row => {
                          const creditAmount = row.groups.reduce(
                            (acc, t) => (t.type === 'CREDIT' ? acc + t.amount.valueInCents : acc),
                            0,
                          );
                          const debitAmount = row.groups.reduce(
                            (acc, t) => (t.type === 'DEBIT' ? acc + t.amount.valueInCents : acc),
                            0,
                          );

                          return (
                            <React.Fragment key={JSON.stringify(row.filter)}>
                              <tr className="group text-sm hover:bg-muted has-[[data-state=open]]:bg-muted ">
                                <td className="flex min-h-8 flex-1 items-center gap-1 overflow-hidden truncate text-wrap py-1 pl-6 text-left sm:pl-10">
                                  <span className="underline-offset-2 transition-colors hover:decoration-slate-400">
                                    {row.label || <TransactionReportRowLabel filter={row.filter} />}
                                  </span>
                                </td>
                                {showCreditDebit ? (
                                  <React.Fragment>
                                    <td className="text-right font-medium">
                                      {debitAmount !== 0 && (
                                        <FormattedMoneyAmount
                                          amountStyles={{ letterSpacing: 0 }}
                                          amount={Math.abs(debitAmount)}
                                          currency={data?.host?.currency}
                                          showCurrencyCode={false}
                                        />
                                      )}
                                    </td>
                                    <td className="text-right font-medium">
                                      {creditAmount !== 0 && (
                                        <FormattedMoneyAmount
                                          amountStyles={{ letterSpacing: 0 }}
                                          amount={Math.abs(creditAmount)}
                                          currency={data?.host?.currency}
                                          showCurrencyCode={false}
                                        />
                                      )}
                                    </td>
                                  </React.Fragment>
                                ) : (
                                  <td className="text-right font-medium">
                                    <FormattedMoneyAmount
                                      amountStyles={{ letterSpacing: 0 }}
                                      amount={row.amount}
                                      currency={data?.host?.currency}
                                      showCurrencyCode={false}
                                    />
                                  </td>
                                )}

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
                                      <DropdownMenuItem onClick={() => viewTransactions(row.filter)}>
                                        <FormattedMessage defaultMessage="View transactions" />
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openExportTransactionsModal(row.filter)}>
                                        <FormattedMessage defaultMessage="Export transactions" />
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                              <LegacyColumnRows
                                parentRow={row}
                                currency={data?.host?.currency}
                                showCreditDebit={showCreditDebit}
                              />
                            </React.Fragment>
                          );
                        })}
                        <tr className="border-t text-right text-base  font-medium">
                          <td className="min-h-8"></td>
                          {showCreditDebit ? (
                            <React.Fragment>
                              <td className="py-1">
                                {section.total < 0 && (
                                  <FormattedMoneyAmount
                                    amount={Math.abs(section.total)}
                                    currency={data?.host?.currency}
                                    showCurrencyCode={false}
                                    amountStyles={{ letterSpacing: 0 }}
                                  />
                                )}
                              </td>
                              <td className="py-1">
                                {section.total > 0 && (
                                  <FormattedMoneyAmount
                                    amount={Math.abs(section.total)}
                                    currency={data?.host?.currency}
                                    showCurrencyCode={false}
                                    amountStyles={{ letterSpacing: 0 }}
                                  />
                                )}
                              </td>
                            </React.Fragment>
                          ) : (
                            <td className="py-1">
                              <FormattedMoneyAmount
                                amount={section.total}
                                currency={data?.host?.currency}
                                showCurrencyCode={false}
                                amountStyles={{ letterSpacing: 0 }}
                              />
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
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
      <ExportTransactionsCSVModal
        open={displayExportCSVModal}
        setOpen={setDisplayExportCSVModal}
        queryFilter={hostTransactionsQueryFilter}
        account={account}
        isHostReport
      />
    </Fragment>
  );
};

export default HostTransactionReport;

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
