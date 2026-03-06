import React from 'react';
import type { QueryResult } from '@apollo/client';
import dayjs from 'dayjs';
import { compact } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '@/lib/currency-utils';
import type {
  CommunityAccountDetailQuery,
  CommunityTransactionSummary,
  TimeSeriesAmount,
} from '@/lib/graphql/types/v2/graphql';
import { AccountType, CommunityRelationType, TimeUnit } from '@/lib/graphql/types/v2/graphql';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';
import { getDashboardRoute } from '@/lib/url-helpers';

import I18nFormatters from '@/components/I18nFormatters';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import StackedAvatars from '@/components/StackedAvatars';
import { DataTable } from '@/components/table/DataTable';
import { Badge } from '@/components/ui/Badge';
import { InfoList, InfoListItem } from '@/components/ui/InfoList';
import PlotFigure, { Plot } from '@/components/ui/Plot';
import { VendorContactTag } from '@/components/vendors/common';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import Link from '../../../Link';
import { DashboardContext } from '../../DashboardContext';
import { Metric } from '../overview/Metric';

import { AccountTaxFormStatus } from './AccountTaxFormStatus';
import { recentTransactionsColumns, RichActivityDate } from './common';

function transactionSummaryToTimeSeries(
  summary: CommunityTransactionSummary[],
  field: 'contributionTotal' | 'expenseTotal',
): TimeSeriesAmount | undefined {
  if (!summary?.length) {
    return undefined;
  }
  const sorted = [...summary].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  const summaryByYear = new Map(sorted.filter(e => e.year !== null).map(e => [e.year, e]));
  const firstYear = sorted[0].year ?? dayjs.utc().year();
  const currentYear = dayjs.utc().year();
  const countField = field === 'contributionTotal' ? 'contributionCount' : 'expenseCount';
  const nodes = [];
  for (let year = firstYear; year <= currentYear; year++) {
    const entry = summaryByYear.get(year);
    nodes.push({
      date: dayjs.utc({ year: year }).toISOString(),
      amount: entry ? entry[field] : { value: 0, currency: sorted[0][field].currency },
      count: entry ? entry[countField] : 0,
    });
  }
  return {
    dateFrom: dayjs.utc({ year: firstYear }).toISOString(),
    dateTo: dayjs.utc({ year: currentYear }).toISOString(),
    timeUnit: TimeUnit.YEAR,
    nodes,
  };
}

export const AccountDetailsOverviewTab = ({
  query,
  expectedAccountType,
}: {
  query: QueryResult<CommunityAccountDetailQuery>;
  expectedAccountType: AccountType;
}) => {
  const { account: dashboardAccount } = React.useContext(DashboardContext);
  const intl = useIntl();

  const isLoading = query.loading;
  const account = query.data?.account;
  const taxForms = query.data?.host?.hostedLegalDocuments;
  const vendorInfo = account?.type === 'VENDOR' ? account['vendorInfo'] : null;
  const relations = compact(account?.communityStats?.relations).filter(
    (relation, _, relations) => !(relation === 'EXPENSE_SUBMITTER' && relations.includes(CommunityRelationType.PAYEE)),
  );
  const isOrgOrCollective = [AccountType.ORGANIZATION, AccountType.COLLECTIVE].includes(
    account?.type || expectedAccountType,
  );
  const adminOf = account && 'adminOf' in account ? account.adminOf.nodes : [];
  const admins = account && 'admins' in account ? account.admins.nodes : [];
  const adminList = isOrgOrCollective ? admins : adminOf;

  const totalContributed = account?.communityStats?.transactionSummary[0]?.contributionTotalAcc || {
    valueInCents: 0,
    currency: dashboardAccount.currency,
  };
  const chargeCount = account?.communityStats?.transactionSummary[0]?.contributionCountAcc || 0;
  const submittedExpensesCount = account?.communityStats?.transactionSummary[0]?.expenseCountAcc || 0;
  const totalPaid = account?.communityStats?.transactionSummary[0]?.expenseTotalAcc || {
    valueInCents: 0,
    currency: dashboardAccount.currency,
  };

  const credits = React.useMemo(
    () => transactionSummaryToTimeSeries(account?.communityStats?.transactionSummary, 'contributionTotal'),
    [account?.communityStats?.transactionSummary],
  );
  const debits = React.useMemo(
    () => transactionSummaryToTimeSeries(account?.communityStats?.transactionSummary, 'expenseTotal'),
    [account?.communityStats?.transactionSummary],
  );

  const creditTransactions = React.useMemo(() => {
    if (!query.data?.transactions?.nodes) {
      return [];
    }
    return query.data.transactions.nodes.filter(transaction => transaction.type === 'CREDIT');
  }, [query.data?.transactions?.nodes]);
  const debitTransactions = React.useMemo(() => {
    if (!query.data?.transactions?.nodes) {
      return [];
    }
    return query.data.transactions.nodes.filter(transaction => transaction.type === 'DEBIT');
  }, [query.data?.transactions?.nodes]);

  return (
    <div className="grid grid-cols-1 gap-12 xl:grid-cols-4">
      <div className="flex flex-col gap-4 sm:flex-row xl:order-2 xl:row-span-2 xl:flex-col">
        <InfoList variant="compact" className="flex grow-1 flex-col rounded-lg border p-4 xl:grow-0">
          <h2 className="tight text-lg font-bold text-slate-800">
            <FormattedMessage defaultMessage="Details" id="Details" />
          </h2>
          <InfoListItem
            title={<FormattedMessage defaultMessage="Legal name" id="OozR1Y" />}
            value={account?.legalName}
            isLoading={isLoading}
            className="text-nowrap"
          />
          <InfoListItem
            title={<FormattedMessage defaultMessage="Display name" id="Fields.displayName" />}
            value={account?.name || account?.slug}
            isLoading={isLoading}
            className="text-nowrap"
          />
          <InfoListItem
            title={<FormattedMessage defaultMessage="Location" id="SectionLocation.Title" />}
            value={
              (account?.location?.country || account?.location?.address) && (
                <LocationAddress location={account.location} />
              )
            }
            isLoading={isLoading}
          />
          {account?.type === 'VENDOR' && vendorInfo && (
            <React.Fragment>
              <InfoListItem
                title={<FormattedMessage defaultMessage="Visible to" id="zJePa1" />}
                value={
                  'visibleToAccounts' in account && account.visibleToAccounts.length > 0 ? (
                    <StackedAvatars
                      accounts={account.visibleToAccounts}
                      imageSize={24}
                      withHoverCard={{ includeAdminMembership: true }}
                    />
                  ) : (
                    <FormattedMessage defaultMessage="All hosted accounts" id="M7USSD" />
                  )
                }
              />
              {vendorInfo.contact && (
                <InfoListItem
                  title={<FormattedMessage defaultMessage="Vendor Contact" id="p1twtU" />}
                  value={
                    <VendorContactTag>
                      {vendorInfo.contact.name}
                      {vendorInfo.contact.email && (
                        <a href={`mailto:${vendorInfo.contact.email}`} className="font-normal">
                          {vendorInfo.contact.email}
                        </a>
                      )}
                    </VendorContactTag>
                  }
                />
              )}
              {vendorInfo.taxType && (
                <InfoListItem
                  title={<FormattedMessage defaultMessage="Company Identifier" id="K0kNyF" />}
                  value={
                    <React.Fragment>
                      {vendorInfo.taxType}: {vendorInfo.taxId}
                    </React.Fragment>
                  }
                />
              )}
              {vendorInfo.notes && (
                <InfoListItem
                  title={<FormattedMessage id="expense.notes" defaultMessage="Notes" />}
                  value={vendorInfo.notes}
                />
              )}
            </React.Fragment>
          )}
        </InfoList>
        <InfoList variant="compact" className="flex grow-1 flex-col rounded-lg border p-4 xl:grow-0">
          <h2 className="tight text-lg font-bold text-slate-800">
            <FormattedMessage defaultMessage="Insights" id="Insights" />
          </h2>
          <InfoListItem
            title={<FormattedMessage defaultMessage="Roles" id="Roles" />}
            value={
              relations.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-1">
                  {relations.map(role => (
                    <Badge key={role} size="sm" type="outline" className="text-nowrap">
                      {formatCommunityRelation(intl, role)}
                    </Badge>
                  ))}
                </div>
              )
            }
            isLoading={isLoading}
          />
          <InfoListItem
            title={
              [AccountType.ORGANIZATION, AccountType.COLLECTIVE].includes(account?.type || expectedAccountType) ? (
                <FormattedMessage defaultMessage="Administrators" id="Administrators" />
              ) : (
                <FormattedMessage defaultMessage="Admin of" id="AdminOf" />
              )
            }
            value={
              adminList.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-2">
                  {adminList.map(member => (
                    <Badge key={member.id} size="sm" type="outline" className="text-nowrap">
                      <LinkCollective
                        key={member.id}
                        collective={member.account}
                        withHoverCard
                        className="flex items-center gap-1 text-nowrap"
                      >
                        <Avatar collective={member.account} size={16} />
                        {member.account.name || member.account.slug}
                      </LinkCollective>
                    </Badge>
                  ))}
                </div>
              )
            }
            isLoading={isLoading}
          />
          <InfoListItem
            title={<FormattedMessage defaultMessage="Tax form" id="TaxForm" />}
            value={
              taxForms?.nodes[0] && (
                <div className="flex flex-col items-start gap-1">
                  <AccountTaxFormStatus
                    taxForm={taxForms.nodes[0]}
                    host={query.data?.host}
                    onRefetch={() => query.refetch()}
                  />
                  {taxForms?.totalCount > 1 && (
                    <Link
                      className="font-normal text-muted-foreground hover:text-foreground hover:underline"
                      href={getDashboardRoute(dashboardAccount, `host-tax-forms?account=${account?.slug}`)}
                    >
                      <FormattedMessage defaultMessage="View all" id="TaxForm.ViewAll" />
                    </Link>
                  )}
                </div>
              )
            }
            isLoading={isLoading}
          />
        </InfoList>
        <InfoList variant="compact" className="flex grow-1 flex-col rounded-lg border p-4 xl:grow-0">
          <h2 className="tight text-lg font-bold text-slate-800 md:col-span-2 lg:col-span-3 xl:col-span-1">
            <FormattedMessage defaultMessage="Platform" id="Platform" />
          </h2>
          <InfoListItem
            title={
              account?.type === 'VENDOR' ? (
                <FormattedMessage id="agreement.createdOn" defaultMessage="Created on" />
              ) : (
                <FormattedMessage defaultMessage="Joined the platform on" id="Vf1x2A" />
              )
            }
            value={account?.createdAt && <DateTime value={account.createdAt} dateStyle="long" />}
            isLoading={isLoading}
          />
          <InfoListItem
            title={<FormattedMessage defaultMessage="First interaction with Host" id="mJq3cC" />}
            value={
              account?.communityStats?.firstInteractionAt && (
                <RichActivityDate
                  date={account?.communityStats?.firstInteractionAt}
                  activity={query.data?.firstActivity?.nodes?.[0]}
                />
              )
            }
            isLoading={isLoading}
          />
          <InfoListItem
            title={<FormattedMessage defaultMessage="Last interaction with Host" id="0k5yUb" />}
            value={
              account?.communityStats?.lastInteractionAt && (
                <RichActivityDate
                  date={account?.communityStats?.lastInteractionAt}
                  activity={query.data?.lastActivity?.nodes?.[0]}
                />
              )
            }
            isLoading={isLoading}
          />
        </InfoList>
      </div>
      <div className="space-y-8 xl:order-1 xl:col-span-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-slate-800">
            <FormattedMessage defaultMessage="Money In" id="MoneyIn" />
            <p className="text-sm font-normal text-muted-foreground">
              <FormattedMessage
                defaultMessage="This section includes all contributions made by this account, including one-time and recurring contributions."
                id="hpn0HC"
              />
            </p>
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Metric
                label={<FormattedMessage defaultMessage="By Year" id="ByYear" />}
                showTimeSeries
                showCurrencyCode
                expanded
                timeseries={credits ? { current: credits, currency: credits.nodes[0]?.amount?.currency } : undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2">
                <Metric
                  label={<FormattedMessage defaultMessage="Total Contributed" id="TotalContributed" />}
                  amount={{ current: totalContributed }}
                  loading={query.loading}
                />
                <Metric
                  label={<FormattedMessage defaultMessage="Charges" id="Dx5IBb" />}
                  helpLabel={
                    <FormattedMessage
                      defaultMessage="<i>Charges</i> refers to the total number of transactions where this account was the contributor and were never refunded. A recurring contribution will incurr a charge for each period, while a one-time contribution will only incur one charge."
                      id="Dx5IBb.Help"
                      values={I18nFormatters}
                    />
                  }
                  count={{ current: chargeCount }}
                  loading={query.loading}
                />
              </div>
              <h3 className="font-semibold text-slate-800">
                <FormattedMessage defaultMessage="Recent Transactions" id="Recent Transactions" />
              </h3>
              <DataTable
                columns={recentTransactionsColumns}
                data={creditTransactions.slice(0, 5)}
                loading={isLoading}
                compact
                hideHeader
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-slate-800">
            <FormattedMessage defaultMessage="Money Out" id="MoneyOut" />
            <p className="text-sm font-normal text-muted-foreground">
              <FormattedMessage
                defaultMessage="This section includes all invoices, grants and reimbursements paid to this account."
                id="e8lC0u"
              />
            </p>
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Metric
                label={<FormattedMessage defaultMessage="By Year" id="ByYear" />}
                className="col-span-1 row-span-1"
                showTimeSeries
                showCurrencyCode
                expanded
                timeseries={debits ? { current: debits, currency: debits.nodes[0]?.amount?.currency } : undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2">
                <Metric
                  label={<FormattedMessage defaultMessage="Total Paid" id="TotalPaid" />}
                  amount={{ current: totalPaid }}
                  loading={query.loading}
                />
                <Metric
                  label={<FormattedMessage defaultMessage="Paid Expenses" id="SSyTot" />}
                  helpLabel={
                    <FormattedMessage
                      defaultMessage="<i>Paid Expenses</i> refers to the number of expenses where this account created and were paid by your Fiscal Host. It does not include invoices and receipts that are pending or rejected."
                      id="Q+UlnX"
                      values={I18nFormatters}
                    />
                  }
                  count={{ current: submittedExpensesCount }}
                  loading={query.loading}
                />
              </div>
              <h3 className="font-semibold text-slate-800">
                <FormattedMessage defaultMessage="Recent Transactions" id="Recent Transactions" />
              </h3>
              <DataTable
                columns={recentTransactionsColumns}
                data={debitTransactions.slice(0, 5)}
                loading={isLoading}
                compact
                hideHeader
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
