import React from 'react';
import type { QueryResult } from '@apollo/client';
import { useQuery } from '@apollo/client';
import { compact } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FiltersToVariables } from '@/lib/filters/filter-types';
import { limit, offset } from '@/lib/filters/schemas';
import type {
  CommunityAccountDetailQuery,
  CommunityAccountOverviewQuery,
  TransactionsTableQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import { AccountType, CommunityRelationType } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';
import { i18nTransactionKind } from '@/lib/i18n/transaction';
import { getDashboardRoute } from '@/lib/url-helpers';

import I18nFormatters from '@/components/I18nFormatters';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import StackedAvatars from '@/components/StackedAvatars';
import { Badge } from '@/components/ui/Badge';
import { InfoList, InfoListItem } from '@/components/ui/InfoList';
import { VendorContactTag } from '@/components/vendors/common';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import Link from '../../../Link';
import { DashboardContext } from '../../DashboardContext';
import type { SubMetricProps } from '../overview/MultiMetric';
import { MultiMetric } from '../overview/MultiMetric';
import { transactionsTableQuery } from '../transactions/queries';
import TransactionsTable from '../transactions/TransactionsTable';

import { AccountTaxFormStatus } from './AccountTaxFormStatus';
import { RichActivityDate } from './common';
import { communityAccountOverviewQuery } from './queries';

export const AccountDetailsOverviewTab = ({
  query,
  expectedAccountType,
  handleTabChange,
}: {
  query: QueryResult<CommunityAccountDetailQuery>;
  expectedAccountType: AccountType;
  setOpenContributionId: (id: number) => void;
  setOpenExpenseId: (id: number) => void;
  handleTabChange: (tab: string) => void;
}) => {
  const { account: dashboardAccount } = React.useContext(DashboardContext);
  const intl = useIntl();

  const overviewQuery = useQuery<CommunityAccountOverviewQuery>(communityAccountOverviewQuery, {
    variables: {
      accountId: query.variables.accountId,
      hostSlug: query.variables.hostSlug,
    },
    skip: !query.variables?.accountId || !query.variables?.hostSlug,
  });

  type RecentTransactionsFilterValues = z.infer<typeof recentTransactionsSchema>;

  const recentTransactionsToVariables: FiltersToVariables<
    RecentTransactionsFilterValues,
    TransactionsTableQueryVariables
  > = {};

  const recentTransactionsSchema = z.object({
    limit: limit.default(5),
    offset,
    openTransactionId: z.coerce.string().optional(),
  });

  const recentTransactionsQueryFilter = useQueryFilter({
    schema: recentTransactionsSchema,
    toVariables: recentTransactionsToVariables,
    filters: {},
    skipRouter: true,
  });

  const recentTransactionsQuery = useQuery(transactionsTableQuery, {
    variables: {
      fromAccount: { id: query.variables?.accountId },
      hostAccount: { slug: query.variables?.hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: false,
      sort: { field: 'CREATED_AT', direction: 'DESC' },
      limit: 5,
      offset: 0,
    },
    skip: !query.variables?.accountId || !query.variables?.hostSlug,
    notifyOnNetworkStatusChange: true,
  });

  const isLoading = query.loading || overviewQuery.loading;
  const account = query.data?.account;
  const overviewAccount = overviewQuery.data?.account;
  const taxForms = query.data?.host?.hostedLegalDocuments;
  const vendorInfo = account?.type === 'VENDOR' ? account['vendorInfo'] : null;
  const relations = compact(overviewAccount?.communityStats?.relations).filter(
    (relation, _, relations) => !(relation === 'EXPENSE_SUBMITTER' && relations.includes(CommunityRelationType.PAYEE)),
  );
  const isOrgOrCollective = [AccountType.ORGANIZATION, AccountType.COLLECTIVE].includes(
    account?.type || expectedAccountType,
  );
  const adminOf = account && 'adminOf' in account ? account.adminOf.nodes : [];
  const admins = account && 'admins' in account ? account.admins.nodes : [];
  const adminList = isOrgOrCollective ? admins : adminOf;

  const allTransactionSummaries = overviewAccount?.communityStats?.transactionSummary ?? [];
  const transactionSummary = allTransactionSummaries.find(s => s.kind === 'ALL');
  const subSummaries = allTransactionSummaries.filter(s => s.kind !== 'ALL');

  const totalContributed = transactionSummary?.creditTotal || {
    valueInCents: 0,
    currency: dashboardAccount.currency,
  };
  const chargeCount = transactionSummary?.creditCount || 0;
  const submittedExpensesCount = transactionSummary?.debitCount || 0;
  const totalPaid = transactionSummary?.debitTotal || {
    valueInCents: 0,
    currency: dashboardAccount.currency,
  };

  const totalContributedSubmetrics: SubMetricProps[] = subSummaries
    .filter(s => s.creditTotal?.valueInCents)
    .map(s => ({ label: i18nTransactionKind(intl, s.kind), amount: s.creditTotal }));

  const chargeCountSubmetrics: SubMetricProps[] = subSummaries
    .filter(s => s.creditCount)
    .map(s => ({ label: i18nTransactionKind(intl, s.kind), count: s.creditCount }));

  const totalPayoutSubmetrics: SubMetricProps[] = subSummaries
    .filter(s => s.debitTotal?.valueInCents)
    .map(s => ({ label: i18nTransactionKind(intl, s.kind), amount: s.debitTotal }));

  const payoutsSubmetrics: SubMetricProps[] = subSummaries
    .filter(s => s.debitCount)
    .map(s => ({ label: i18nTransactionKind(intl, s.kind), count: s.debitCount }));

  const credits = overviewAccount?.communityStats?.creditTimeSeries;
  const debits = overviewAccount?.communityStats?.debitTimeSeries;
  const recentTransactions = recentTransactionsQuery.data?.transactions;

  return (
    <div className="flex flex-col gap-12 xl:flex-row-reverse">
      <div className="flex flex-col gap-4 xl:w-1/4">
        <InfoList variant="compact" className="flex grow-1 flex-col gap-3 rounded-lg border p-4">
          <h2 className="tight text-lg font-bold text-slate-800">
            <FormattedMessage defaultMessage="Details" id="Details" />
          </h2>
          <InfoListItem
            title={<FormattedMessage defaultMessage="Legal name" id="OozR1Y" />}
            isLoading={isLoading}
            value={account?.legalName}
          />
          <InfoListItem
            title={<FormattedMessage defaultMessage="Display name" id="Fields.displayName" />}
            value={account?.name || account?.slug}
            isLoading={isLoading}
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
                  className="overflow-x-hidden"
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
        <InfoList variant="compact" className="flex grow-1 flex-col gap-3 rounded-lg border p-4">
          <h2 className="tight text-lg font-bold text-slate-800">
            <FormattedMessage defaultMessage="Insights" id="Insights" />
          </h2>
          <InfoListItem
            title={<FormattedMessage defaultMessage="Roles" id="c35gM5" />}
            value={
              relations.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-1">
                  {relations.map(role => (
                    <Badge key={role} size="sm" type="outline" className="truncate text-nowrap">
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
                <FormattedMessage defaultMessage="Administrators" id="administrators" />
              ) : (
                <FormattedMessage defaultMessage="Admin of" id="AdminOf" />
              )
            }
            value={
              adminList.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-2 overflow-x-hidden">
                  {adminList.map(member => (
                    <Badge key={member.id} size="sm" type="outline" className="truncate text-nowrap">
                      <LinkCollective
                        key={member.id}
                        collective={member.account}
                        withHoverCard
                        className="flex items-center gap-1 text-nowrap"
                      >
                        <Avatar collective={member.account} size={16} />
                        <span className="truncate">{member.account.name || member.account.slug}</span>
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
        <InfoList variant="compact" className="flex grow-1 flex-col gap-3 rounded-lg border p-4">
          <h2 className="tight text-lg font-bold text-slate-800 md:col-span-2 lg:col-span-3 xl:col-span-1">
            <FormattedMessage defaultMessage="Platform" id="platform" />
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
              overviewAccount?.communityStats?.firstInteractionAt && (
                <RichActivityDate
                  date={overviewAccount?.communityStats?.firstInteractionAt}
                  activity={query.data?.firstActivity?.nodes?.[0]}
                />
              )
            }
            isLoading={isLoading}
          />
          <InfoListItem
            title={<FormattedMessage defaultMessage="Last interaction with Host" id="0k5yUb" />}
            value={
              overviewAccount?.communityStats?.lastInteractionAt && (
                <RichActivityDate
                  date={overviewAccount?.communityStats?.lastInteractionAt}
                  activity={query.data?.lastActivity?.nodes?.[0]}
                />
              )
            }
            isLoading={isLoading}
          />
        </InfoList>
      </div>
      <div className="space-y-8 xl:w-3/4">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-slate-800">
            <FormattedMessage defaultMessage="Money In & Out" id="MoneyInOut" />
            <p className="text-sm font-normal text-muted-foreground">
              <FormattedMessage
                defaultMessage="This section provides an overview of the money you received from this account (In) and the money you paid to this account (Out)."
                id="MoneyInOut.Description"
              />
            </p>
          </h2>
          <MultiMetric
            label={<FormattedMessage defaultMessage="Volume by Year" id="VolumeByYear" />}
            loading={query.loading}
            expanded
            timeseries={
              credits || debits
                ? {
                    series: [
                      ...(credits
                        ? [
                            {
                              label: intl.formatMessage({
                                defaultMessage: 'Money In',
                                id: 'solutions.features.section.money-in.title',
                              }),
                              timeseries: credits,
                            },
                          ]
                        : []),
                      ...(debits
                        ? [
                            {
                              label: intl.formatMessage({
                                defaultMessage: 'Money Out',
                                id: 'solutions.features.section.money-out.title',
                              }),
                              timeseries: debits,
                            },
                          ]
                        : []),
                    ],
                    colors: ['#1d4ed8', '#dc2626'],
                    currency: credits?.nodes[0]?.amount?.currency ?? debits?.nodes[0]?.amount?.currency,
                  }
                : undefined
            }
          />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="col-span-2 flex flex-col gap-2">
              <div className="grid grid-flow-dense grid-cols-4 gap-4">
                <MultiMetric
                  label={<FormattedMessage defaultMessage="Total Money In" id="TotalMoneyIn" />}
                  helpLabel={
                    <FormattedMessage
                      id="AqJJw2"
                      defaultMessage="<i>Total Money In</i> refers to the total amount of money your Fiscal Host received on behalf of this account."
                      values={I18nFormatters}
                    />
                  }
                  amount={totalContributed}
                  loading={query.loading}
                  submetrics={totalContributedSubmetrics}
                />
                <MultiMetric
                  label={<FormattedMessage defaultMessage="Money In Transactions" id="MoneyInTransactions" />}
                  helpLabel={
                    <FormattedMessage
                      id="89EVv4"
                      defaultMessage="<i>Money In Transactions</i> refers to the number of transactions where your Fiscal Host received money on behalf of this account. It includes contributions, added funds, and any other transactions that resulted in a net positive amount for you or any of your hosted Collectives."
                      values={I18nFormatters}
                    />
                  }
                  count={chargeCount}
                  loading={query.loading}
                  submetrics={chargeCountSubmetrics}
                />
                <MultiMetric
                  label={<FormattedMessage defaultMessage="Total Money Out" id="TotalMoneyOut" />}
                  helpLabel={
                    <FormattedMessage
                      id="VB/5st"
                      defaultMessage="<i>Total Money Out</i> refers to the total amount of money your Fiscal Host paid to this account. It includes paid expenses, refunds, and any other transactions that resulted in a net negative amount for you or any of your hosted Collectives."
                      values={I18nFormatters}
                    />
                  }
                  amount={totalPaid}
                  loading={query.loading}
                  submetrics={totalPayoutSubmetrics}
                />
                <MultiMetric
                  label={<FormattedMessage defaultMessage="Money Out Transactions" id="MoneyOutTransactions" />}
                  helpLabel={
                    <FormattedMessage
                      id="Q+pzHc"
                      defaultMessage="<i>Money Out Transactions</i> refers to the number of transactions where your Fiscal Host paid money to this account. It includes paid expenses, refunds, and any other transactions that resulted in a net negative amount for you or any of your hosted Collectives."
                      values={I18nFormatters}
                    />
                  }
                  count={submittedExpensesCount}
                  loading={query.loading}
                  submetrics={payoutsSubmetrics}
                />
              </div>
              <h3 className="font-semibold text-slate-800">
                <FormattedMessage defaultMessage="Recent Transactions" id="Recent Transactions" />
              </h3>
              <TransactionsTable
                transactions={recentTransactions}
                loading={recentTransactionsQuery.loading}
                nbPlaceholders={5}
                queryFilter={recentTransactionsQueryFilter}
                refetchList={recentTransactionsQuery.refetch}
                hideHeader
                hidePagination
                hideColumns={['oppositeAccount']}
                footer={
                  <div className="flex min-h-[49px] w-full items-center justify-center border-t">
                    <button
                      onClick={() => handleTabChange('TRANSACTIONS')}
                      className="font-normal text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <FormattedMessage defaultMessage="View more" id="34Up+l" />
                    </button>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
