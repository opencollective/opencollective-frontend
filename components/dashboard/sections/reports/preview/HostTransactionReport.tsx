import React, { Fragment } from 'react';
import { useQuery } from '@apollo/client';
import { ChevronDown, FlaskConical, Megaphone } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { boolean } from '../../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../../lib/hooks/useQueryFilter';

import { FEEDBACK_KEY, FeedbackModal } from '../../../../FeedbackModal';
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
import { filterToHostTransactionsFilterValues } from './helpers';
import { HostReportTabs } from './HostReportTabs';
import { ReportNavigationArrows } from './NavigationArrows';
import { hostReportQuery } from './queries';
import { ReportContent } from './ReportContent';
import { deserializeReportSlug, ReportPeriodSelector } from './ReportPeriodSelector';
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
    const transactionsFilters = filterToHostTransactionsFilterValues(hostSlug, rowFilter, variables);
    hostTransactionsQueryFilter.resetFilters(transactionsFilters);
    setDisplayExportCSVModal(true);
  };

  const viewTransactions = (rowFilter: GroupFilter = {}) => {
    const transactionsFilters = filterToHostTransactionsFilterValues(hostSlug, rowFilter, variables);
    hostTransactionsQueryFilter.resetFilters(transactionsFilters, `/dashboard/${hostSlug}/host-transactions`);
  };

  const showCreditDebit = layout === TestLayout.DEBITCREDIT;
  const currentRawReport =
    data?.host?.hostTransactionsReports?.nodes[0]?.[queryFilter.values.isHost ? 'operationalFunds' : 'managedFunds'];

  const report = buildReport(currentRawReport, {
    filter: { isHost: queryFilter.values.isHost },
    showCreditDebit,
    useComputationalLayout: queryFilter.values.computational,
  });

  if (!variables) {
    return (
      <MessageBox withIcon type="error">
        <FormattedMessage defaultMessage="Report can't be found." id="ab9Jm3" />
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
                    <FormattedMessage defaultMessage="Export transactions" id="T72ceA" />
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
              <HostReportTabs queryFilter={queryFilter} />

              <ReportContent
                variables={variables}
                report={report}
                openExportTransactionsModal={openExportTransactionsModal}
                viewTransactions={viewTransactions}
                currency={data?.host?.currency}
                showCreditDebit={showCreditDebit}
              />
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
              <Megaphone size={16} /> <FormattedMessage defaultMessage="Give feedback" id="GiveFeedback" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <FeedbackModal
        title={<FormattedMessage defaultMessage="Give feedback on the new Host Transactions Report" id="rKPVz/" />}
        feedbackKey={FEEDBACK_KEY.HOST_REPORTS}
        open={feedbackModalOpen}
        setOpen={setFeedbackModalOpen}
      />
    </React.Fragment>
  );
};
