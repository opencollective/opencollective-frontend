import React from 'react';
import type { QueryResult } from '@apollo/client';
import { useQuery } from '@apollo/client';
import { compact } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { limit, offset } from '@/lib/filters/schemas';
import type { CommunityAccountDetailQuery, CommunityAccountOverviewQuery } from '@/lib/graphql/types/v2/graphql';
import { AccountType, CommunityRelationType, TransactionType } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import formatCollectiveType from '@/lib/i18n/collective-type';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';

import HeroSocialLinks from '@/components/crowdfunding-redesign/SocialLinks';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import StackedAvatars from '@/components/StackedAvatars';
import { Badge } from '@/components/ui/Badge';
import { DataList, DataListItem } from '@/components/ui/DataList';
import { Skeleton } from '@/components/ui/Skeleton';
import { getEffectiveVendorPolicyLabel, VendorContactTag } from '@/components/vendors/common';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import { Metric } from '../overview/Metric';
import { transactionsTableQuery } from '../transactions/queries';
import type { TransactionsTableProps } from '../transactions/TransactionsTable';
import TransactionsTable from '../transactions/TransactionsTable';

import { AccountDetailView, RichActivityDate } from './common';
import { communityAccountOverviewQuery } from './queries';

const recentTransactionsSchema = z.object({
  limit: limit.default(5),
  offset,
  openTransactionId: z.coerce.string().optional(),
});

const VendorPolicyValue = ({
  vendor,
  host,
}: {
  vendor: Parameters<typeof getEffectiveVendorPolicyLabel>[0];
  host: Parameters<typeof getEffectiveVendorPolicyLabel>[1];
}) => {
  const intl = useIntl();
  const { label, isInherited } = getEffectiveVendorPolicyLabel(vendor, host, intl);
  return (
    <span>
      {label}
      {isInherited && (
        <span className="ml-1 text-xs text-muted-foreground">
          <FormattedMessage defaultMessage="(host default)" id="wGmb1I" />
        </span>
      )}
    </span>
  );
};

export const AccountDetailsOverviewTab = ({
  query,
  expectedAccountType,
  handleTabChange,
  handleTransactionTableRowClick,
}: {
  query: QueryResult<CommunityAccountDetailQuery>;
  expectedAccountType: AccountType;
  handleTabChange: (tab: string) => void;
  handleTransactionTableRowClick: TransactionsTableProps['onClickRow'];
}) => {
  const intl = useIntl();

  const overviewQuery = useQuery<CommunityAccountOverviewQuery>(communityAccountOverviewQuery, {
    variables: {
      accountId: query.variables.accountId,
      hostSlug: query.variables.hostSlug,
    },
    skip: !query.variables?.accountId || !query.variables?.hostSlug,
  });

  const recentCreditsQueryFilter = useQueryFilter({
    schema: recentTransactionsSchema,
    filters: {},
    skipRouter: true,
  });

  const recentDebitsQueryFilter = useQueryFilter({
    schema: recentTransactionsSchema,
    filters: {},
    skipRouter: true,
  });

  const recentCreditsQuery = useQuery(transactionsTableQuery, {
    variables: {
      fromAccount: { id: query.variables?.accountId },
      hostAccount: { slug: query.variables?.hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: false,
      sort: { field: 'CREATED_AT', direction: 'DESC' },
      limit: 5,
      offset: 0,
      type: TransactionType.CREDIT,
    },
    skip: !query.variables?.accountId || !query.variables?.hostSlug,
    notifyOnNetworkStatusChange: true,
  });

  const recentDebitsQuery = useQuery(transactionsTableQuery, {
    variables: {
      fromAccount: { id: query.variables?.accountId },
      hostAccount: { slug: query.variables?.hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: false,
      sort: { field: 'CREATED_AT', direction: 'DESC' },
      limit: 5,
      offset: 0,
      type: TransactionType.DEBIT,
    },
    skip: !query.variables?.accountId || !query.variables?.hostSlug,
    notifyOnNetworkStatusChange: true,
  });

  const isLoading = query.loading || overviewQuery.loading;
  const account = query.data?.account;
  const name =
    account?.name ||
    account?.legalName ||
    account?.slug ||
    formatCollectiveType(intl, account?.type || expectedAccountType);
  const overviewAccount = overviewQuery.data?.account;
  const vendorInfo = account?.type === 'VENDOR' ? account['vendorInfo'] : null;
  const relations = compact(overviewAccount?.communityStats?.relations).filter(
    (relation, _, relations) => !(relation === 'EXPENSE_SUBMITTER' && relations.includes(CommunityRelationType.PAYEE)),
  );
  const isIndividual = account?.type === AccountType.INDIVIDUAL;
  const adminOf = account && 'adminOf' in account ? account.adminOf.nodes : [];
  const admins = account && 'admins' in account ? account.admins.nodes : [];
  const adminList = isIndividual ? adminOf : admins;

  const allTransactionSummaries = overviewAccount?.communityStats?.transactionSummary ?? [];
  const transactionSummary = allTransactionSummaries.find(s => s.kind === 'ALL');

  const totalContributed = transactionSummary?.creditTotal;
  const chargeCount = transactionSummary?.creditCount;
  const submittedExpensesCount = transactionSummary?.debitCount;
  const totalPaid = transactionSummary?.debitTotal;

  const credits = overviewAccount?.communityStats?.creditTimeSeries;
  const debits = overviewAccount?.communityStats?.debitTimeSeries;

  const recentCredits = recentCreditsQuery.data?.transactions;
  const recentDebits = recentDebitsQuery.data?.transactions;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4">
        <div className="flex grow-1 flex-col gap-3 rounded-lg border p-4">
          <h2 className="tight text-lg font-bold text-slate-800">
            <FormattedMessage defaultMessage="Details" id="Details" />
          </h2>
          <DataList className="text-sm">
            <DataListItem
              label={<FormattedMessage defaultMessage="Legal name" id="OozR1Y" />}
              value={
                isLoading ? (
                  <Skeleton className="h-4 w-1/2" />
                ) : (
                  account?.legalName || (
                    <span className="text-muted-foreground">
                      <FormattedMessage defaultMessage="None" id="450Fty" />
                    </span>
                  )
                )
              }
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="Display name" id="Fields.displayName" />}
              value={isLoading ? <Skeleton className="h-4 w-1/2" /> : account?.name || account?.slug}
            />
            {account?.__typename === 'Individual' && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Email" id="Email" />}
                value={isLoading ? <Skeleton className="h-4 w-1/2" /> : account?.email}
              />
            )}
            <DataListItem
              label={<FormattedMessage defaultMessage="Location" id="SectionLocation.Title" />}
              value={
                isLoading ? (
                  <Skeleton className="h-4 w-1/2" />
                ) : account?.location?.country || account?.location?.address ? (
                  <LocationAddress location={account.location} />
                ) : (
                  <span className="text-muted-foreground">
                    <FormattedMessage defaultMessage="None" id="450Fty" />
                  </span>
                )
              }
            />
            {account?.socialLinks?.length > 0 && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Social Links" id="3bLmoU" />}
                value={<HeroSocialLinks className="size-6" socialLinks={account.socialLinks} />}
              />
            )}
            {account?.type === 'VENDOR' && vendorInfo && (
              <React.Fragment>
                <DataListItem
                  label={<FormattedMessage defaultMessage="Visible to" id="zJePa1" />}
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
                <DataListItem
                  label={<FormattedMessage defaultMessage="Who can use" id="56SUDL" />}
                  value={
                    <VendorPolicyValue
                      vendor={'useVendorPolicy' in account ? account : { useVendorPolicy: null }}
                      host={query.data?.host}
                    />
                  }
                />
                {vendorInfo.contact && (
                  <DataListItem
                    className="overflow-x-hidden"
                    label={<FormattedMessage defaultMessage="Vendor Contact" id="p1twtU" />}
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
                  <DataListItem
                    label={<FormattedMessage defaultMessage="Company Identifier" id="K0kNyF" />}
                    value={
                      <React.Fragment>
                        {vendorInfo.taxType}: {vendorInfo.taxId}
                      </React.Fragment>
                    }
                  />
                )}
                {vendorInfo.notes && (
                  <DataListItem
                    label={<FormattedMessage id="expense.notes" defaultMessage="Notes" />}
                    value={vendorInfo.notes}
                  />
                )}
              </React.Fragment>
            )}
          </DataList>
        </div>
        <div className="flex grow-1 flex-col gap-3 rounded-lg border p-4">
          <h2 className="tight text-lg font-bold text-slate-800 md:col-span-2 lg:col-span-3 xl:col-span-1">
            <FormattedMessage defaultMessage="Platform Activity" id="PlatformActivity" />
          </h2>
          <DataList className="text-sm">
            <DataListItem
              label={
                account?.type === 'VENDOR' ? (
                  <FormattedMessage id="agreement.createdOn" defaultMessage="Created on" />
                ) : (
                  <FormattedMessage defaultMessage="Joined on" id="Vf1x2A" />
                )
              }
              value={
                isLoading ? (
                  <Skeleton className="h-4 w-1/2" />
                ) : (
                  account?.createdAt && <DateTime value={account.createdAt} dateStyle="long" />
                )
              }
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="First interaction" id="s59Pf2" />}
              value={
                isLoading ? (
                  <Skeleton className="h-4 w-1/2" />
                ) : (
                  overviewAccount?.communityStats?.firstInteractionAt && (
                    <RichActivityDate
                      date={overviewAccount?.communityStats?.firstInteractionAt}
                      activity={query.data?.firstActivity?.nodes?.[0]}
                    />
                  )
                )
              }
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="Latest interaction" id="U62c6d" />}
              value={
                isLoading ? (
                  <Skeleton className="h-4 w-1/2" />
                ) : (
                  overviewAccount?.communityStats?.lastInteractionAt && (
                    <RichActivityDate
                      date={overviewAccount?.communityStats?.lastInteractionAt}
                      activity={query.data?.lastActivity?.nodes?.[0]}
                    />
                  )
                )
              }
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="Roles" id="c35gM5" />}
              value={
                isLoading ? (
                  <Skeleton className="h-4 w-1/2" />
                ) : (
                  relations.length > 0 && (
                    <div className="flex flex-wrap items-baseline gap-1">
                      {relations.map(role => (
                        <Badge key={role} size="sm" type="outline" className="truncate text-nowrap">
                          {formatCommunityRelation(intl, role)}
                        </Badge>
                      ))}
                    </div>
                  )
                )
              }
            />
          </DataList>
        </div>
      </div>
      {adminList.length > 0 && (
        <div className="flex grow-1 flex-row items-center gap-3 rounded-lg border p-4">
          <h2 className="tight text-lg font-bold text-nowrap text-slate-800">
            {[AccountType.ORGANIZATION, AccountType.COLLECTIVE].includes(account?.type || expectedAccountType) ? (
              <FormattedMessage defaultMessage="Administrators" id="administrators" />
            ) : (
              <FormattedMessage defaultMessage="Admin of" id="AdminOf" />
            )}
          </h2>
          {adminList.length > 0 && (
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
          )}
        </div>
      )}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Metric
            className="order-1 xl:order-1"
            label={<FormattedMessage defaultMessage="Received from {name}" id="ReceivedFrom" values={{ name }} />}
            noTimeseriesLabel={
              <FormattedMessage
                defaultMessage="No contributions from {name}"
                id="Metric.NoContributions"
                values={{ name }}
              />
            }
            loading={isLoading}
            showTimeSeries
            expanded
            amount={{ current: totalContributed }}
            count={{ current: chargeCount }}
            timeseries={
              credits
                ? {
                    current: credits,
                    currency: credits?.nodes[0]?.amount?.currency,
                  }
                : undefined
            }
          />
          <Metric
            className="order-3 xl:order-2"
            label={<FormattedMessage defaultMessage="Disbursed to {name}" id="DisbursedTo" values={{ name }} />}
            noTimeseriesLabel={
              <FormattedMessage
                defaultMessage="No disbursements to {name}"
                id="Metric.NoDisbursements"
                values={{ name }}
              />
            }
            loading={isLoading}
            showTimeSeries
            expanded
            amount={{ current: totalPaid }}
            count={{ current: submittedExpensesCount }}
            color="#dc2626"
            timeseries={
              debits
                ? {
                    current: debits,
                    currency: debits?.nodes[0]?.amount?.currency,
                  }
                : undefined
            }
          />
          <div className="order-2 flex flex-col gap-2 xl:order-3">
            <h3 className="text-sm font-medium text-slate-800">
              <FormattedMessage defaultMessage="Recently Received" id="RecentlyReceived" />
            </h3>
            <TransactionsTable
              transactions={recentCredits}
              loading={recentCreditsQuery.loading}
              nbPlaceholders={5}
              queryFilter={recentCreditsQueryFilter}
              refetchList={recentCreditsQuery.refetch}
              hideHeader
              hidePagination
              meta={{
                timeStyle: null,
              }}
              onClickRow={handleTransactionTableRowClick}
              columns={['date', 'account', 'amount', 'currency']}
              footer={
                recentCredits?.nodes?.length > 0 && (
                  <div className="flex min-h-[49px] w-full items-center justify-center border-t">
                    <button
                      onClick={() => handleTabChange(AccountDetailView.TRANSACTIONS)}
                      className="font-normal text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <FormattedMessage defaultMessage="View more" id="34Up+l" />
                    </button>
                  </div>
                )
              }
            />
          </div>
          <div className="order-4 flex flex-col gap-2 xl:order-4">
            <h3 className="text-sm font-medium text-slate-800">
              <FormattedMessage defaultMessage="Recently Disbursed" id="RecentlyDisbursed" />
            </h3>
            <TransactionsTable
              transactions={recentDebits}
              loading={recentDebitsQuery.loading}
              nbPlaceholders={5}
              queryFilter={recentDebitsQueryFilter}
              refetchList={recentDebitsQuery.refetch}
              hideHeader
              hidePagination
              meta={{
                timeStyle: null,
              }}
              onClickRow={handleTransactionTableRowClick}
              columns={['date', 'account', 'amount', 'currency']}
              footer={
                recentDebits?.nodes?.length > 0 && (
                  <div className="flex min-h-[49px] w-full items-center justify-center border-t">
                    <button
                      onClick={() => handleTabChange(AccountDetailView.TRANSACTIONS)}
                      className="font-normal text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <FormattedMessage defaultMessage="View more" id="34Up+l" />
                    </button>
                  </div>
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
