import React from 'react';
import type { QueryResult } from '@apollo/client';
import { useQuery } from '@apollo/client';
import { compact } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import type { CommunityAccountDetailQuery, CommunityAccountOverviewQuery } from '@/lib/graphql/types/v2/graphql';
import { AccountType, CommunityRelationType } from '@/lib/graphql/types/v2/graphql';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';
import { getDashboardRoute } from '@/lib/url-helpers';

import I18nFormatters from '@/components/I18nFormatters';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import StackedAvatars from '@/components/StackedAvatars';
import { DataTable } from '@/components/table/DataTable';
import { Badge } from '@/components/ui/Badge';
import { InfoList, InfoListItem } from '@/components/ui/InfoList';
import { VendorContactTag } from '@/components/vendors/common';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import Link from '../../../Link';
import { DashboardContext } from '../../DashboardContext';
import { Metric } from '../overview/Metric';
import { MultiMetric } from '../overview/MultiMetric';

import { AccountTaxFormStatus } from './AccountTaxFormStatus';
import { recentTransactionsColumns, RichActivityDate } from './common';
import { communityAccountOverviewQuery } from './queries';

export const AccountDetailsOverviewTab = ({
  query,
  expectedAccountType,
  setOpenContributionId,
  setOpenExpenseId,
}: {
  query: QueryResult<CommunityAccountDetailQuery>;
  expectedAccountType: AccountType;
  setOpenContributionId: (id: number) => void;
  setOpenExpenseId: (id: number) => void;
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

  const totalContributed = overviewAccount?.communityStats?.transactionSummary.creditTotal || {
    valueInCents: 0,
    currency: dashboardAccount.currency,
  };
  const chargeCount = overviewAccount?.communityStats?.transactionSummary.creditCount || 0;
  const submittedExpensesCount = overviewAccount?.communityStats?.transactionSummary.debitCount || 0;
  const totalPaid = overviewAccount?.communityStats?.transactionSummary.debitTotal || {
    valueInCents: 0,
    currency: dashboardAccount.currency,
  };

  const credits = overviewAccount?.communityStats?.creditTimeSeries;
  const debits = overviewAccount?.communityStats?.debitTimeSeries;
  const creditTransactions = overviewQuery.data?.recentMoneyIn?.nodes ?? [];
  const debitTransactions = overviewQuery.data?.recentMoneyOut?.nodes ?? [];

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
                defaultMessage="Overview of all contributions made by and payments to this account."
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
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-slate-800">
                <FormattedMessage defaultMessage="Money In" id="solutions.features.section.money-in.title" />
              </h3>
              <div className="grid grid-flow-dense grid-cols-2 gap-4">
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
              <DataTable<CommunityAccountOverviewQuery['recentMoneyIn']['nodes'][0], unknown>
                columns={recentTransactionsColumns}
                data={creditTransactions}
                onClickRow={row => row.original.order?.legacyId && setOpenContributionId(row.original.order?.legacyId)}
                loading={isLoading}
                compact
                hideHeader
              />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-slate-800">
                <FormattedMessage defaultMessage="Money Out" id="solutions.features.section.money-out.title" />
              </h3>
              <div className="grid grid-flow-dense grid-cols-2 gap-4">
                <Metric
                  label={<FormattedMessage defaultMessage="Total Paid" id="TotalPaid" />}
                  amount={{ current: totalPaid }}
                  loading={query.loading}
                />
                <Metric
                  label={<FormattedMessage defaultMessage="Payouts" id="Payouts" />}
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
              <DataTable<CommunityAccountOverviewQuery['recentMoneyOut']['nodes'][0], unknown>
                columns={recentTransactionsColumns}
                data={debitTransactions}
                onClickRow={row => row.original.expense?.legacyId && setOpenExpenseId(row.original.expense?.legacyId)}
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
