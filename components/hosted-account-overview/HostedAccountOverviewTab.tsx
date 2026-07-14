import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { isEmpty } from 'lodash-es';
import { ArrowRight, Mail, MailMinus, Pencil } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import dayjs from '@/lib/dayjs';
import { i18nGraphqlException } from '@/lib/errors';
import { limit, offset } from '@/lib/filters/schemas';
import type {
  HostedAccountFinancialActivityQuery,
  HostedAccountFinancialActivityQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import { TransactionKind, TransactionType } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { i18nExpenseType } from '@/lib/i18n/expense';
import { formatHostFeeStructure } from '@/lib/i18n/host-fee-structure';

import Avatar from '@/components/Avatar';
import { ContributionDrawer } from '@/components/contributions/ContributionDrawer';
import HeroSocialLinks from '@/components/crowdfunding-redesign/SocialLinks';
import { DashboardContentCard } from '@/components/dashboard/DashboardContentCard';
import { transactionsTableQuery } from '@/components/dashboard/sections/transactions/queries';
import TransactionsTable, {
  type TransactionsTableProps,
} from '@/components/dashboard/sections/transactions/TransactionsTable';
import DateTime from '@/components/DateTime';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import I18nCollectiveTags from '@/components/I18nCollectiveTags';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import ConfirmationModal from '@/components/NewConfirmationModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataList, DataListItem } from '@/components/ui/DataList';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

import { EditCollectiveSettingsModal } from './EditCollectiveSettingsModal';
import { buildKindActivity } from './financialActivity';
import { HostedAccountContributionsPayoutsSection } from './HostedAccountContributionsPayoutsSection';
import type { MoneyMovementsView } from './HostedAccountMoneyMovementsTab';
import { HostedAccountOverviewChart } from './HostedAccountOverviewChart';
import { hostedAccountFinancialActivityQuery } from './queries';
import type { HostedAccountProfileData } from './types';
import { HostedAccountView } from './types';

const BALANCE_COLOR = '#f59e0b';
const RECEIVED_COLOR = '#14b8a6';
const SPENT_COLOR = '#dc2626';

const recentTransactionsSchema = z.object({
  limit: limit.default(5),
  offset,
  openTransactionId: z.coerce.string().optional(),
});

type RecentTransaction = NonNullable<HostedAccountProfileData['recentContributions']>['nodes'][number];

const cancelMemberInvitationMutation = gql`
  mutation CancelMemberInvitationInOverview($invitation: MemberInvitationReferenceInput!) {
    cancelMemberInvitation(invitation: $invitation)
  }
`;

type HostedAccountOverviewTabProps = {
  account?: HostedAccountProfileData;
  host?: { id?: string; hostFeePercent?: number | null } | null;
  hostSlug: string;
  openTab: (tab: HostedAccountView, moneyMovementsView?: MoneyMovementsView) => void;
  refetch?: () => void;
};

const InteractionValue = ({
  tx,
  onOpen,
}: {
  tx?: RecentTransaction | null;
  onOpen: (tx: RecentTransaction) => void;
}) => {
  if (!tx) {
    return <span className="text-muted-foreground">—</span>;
  }
  const legacyId = tx.expense?.legacyId || tx.order?.legacyId;
  const canOpen = Boolean(tx.expense || tx.order);
  const amount = (
    <FormattedMoneyAmount
      amount={Math.abs(tx.netAmount.valueInCents)}
      currency={tx.netAmount.currency as any}
      showCurrencyCode={false}
    />
  );
  const ref = legacyId ? `#${legacyId}` : '';
  const link = (chunks: React.ReactNode) =>
    canOpen ? (
      <button type="button" className="underline hover:text-primary" onClick={() => onOpen(tx)}>
        {chunks}
      </button>
    ) : (
      <span>{chunks}</span>
    );
  return (
    <span>
      <DateTime value={tx.clearedAt || tx.createdAt} dateStyle="long" />
      {' • '}
      {tx.type === 'CREDIT' ? (
        <FormattedMessage
          defaultMessage="Made a <link>{amount} contribution {ref}</link>"
          id="A6QI7z"
          values={{ amount, ref, link }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="Made a <link>{amount} payout {ref}</link>"
          id="BtoPiB"
          values={{ amount, ref, link }}
        />
      )}
    </span>
  );
};

type AmountLike = { valueInCents?: number | null; currency?: string | null } | null | undefined;

const Metric = ({
  label,
  amount,
  currency,
  onClick,
}: {
  label: React.ReactNode;
  amount?: AmountLike;
  currency?: string;
  onClick?: () => void;
}) => (
  <div className="flex flex-col gap-1">
    <button
      type="button"
      className={`flex items-center gap-1 text-left text-sm text-muted-foreground ${onClick ? 'hover:text-foreground' : 'cursor-default'}`}
      onClick={onClick}
      disabled={!onClick}
    >
      {label}
      {onClick && <ArrowRight size={14} />}
    </button>
    <span className="text-2xl font-semibold text-foreground">
      {amount && typeof amount.valueInCents === 'number' ? (
        <FormattedMoneyAmount
          amount={Math.abs(amount.valueInCents)}
          currency={(amount.currency || currency) as any}
          showCurrencyCode
          precision={2}
        />
      ) : (
        '—'
      )}
    </span>
  </div>
);

const RecentTransactionsCard = ({
  title,
  transactions,
  loading,
  queryFilter,
  refetch,
  onRowClick,
  onViewAll,
}: {
  title: React.ReactNode;
  transactions: TransactionsTableProps['transactions'];
  loading?: boolean;
  queryFilter: TransactionsTableProps['queryFilter'];
  refetch: TransactionsTableProps['refetchList'];
  onRowClick: TransactionsTableProps['onClickRow'];
  onViewAll: () => void;
}) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-sm font-medium text-slate-800">{title}</h3>
    <TransactionsTable
      transactions={transactions}
      loading={loading}
      nbPlaceholders={5}
      queryFilter={queryFilter}
      refetchList={refetch}
      hideHeader
      hidePagination
      meta={{ timeStyle: null }}
      onClickRow={onRowClick}
      columns={['date', 'account', 'amount', 'currency']}
      footer={
        transactions?.nodes?.length > 0 && (
          <div className="flex min-h-[49px] w-full items-center justify-center border-t">
            <button
              onClick={onViewAll}
              className="font-normal text-muted-foreground hover:text-foreground hover:underline"
            >
              <FormattedMessage defaultMessage="View all" id="pFK6bJ" />
            </button>
          </div>
        )
      }
    />
  </div>
);

export function HostedAccountOverviewTab({ account, host, hostSlug, openTab, refetch }: HostedAccountOverviewTabProps) {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const [openExpenseId, setOpenExpenseId] = React.useState<number | null>(null);
  const [openContributionId, setOpenContributionId] = React.useState<number | null>(null);
  const [isEditSettingsOpen, setEditSettingsOpen] = React.useState(false);
  const [invitationToCancel, setInvitationToCancel] = React.useState(null);
  const [cancelMemberInvitation] = useMutation(cancelMemberInvitationMutation);

  const currency = account?.currency;
  const stats = account?.stats;
  const isChild = Boolean(account?.parent?.id);
  const isHosted = Boolean(account?.host?.id);

  const hostFeePercent = account?.hostFeePercent ?? host?.hostFeePercent;
  const hostFeeStructureLabel = account?.hostFeesStructure
    ? formatHostFeeStructure(intl, account.hostFeesStructure)
    : null;
  const accountExpenseTypes: Record<string, boolean> = account?.settings?.expenseTypes ?? {};
  const enabledExpenseTypes = Object.keys(accountExpenseTypes)
    .filter(type => accountExpenseTypes[type])
    .map(type => i18nExpenseType(intl, type));
  const adminsCanSeePayoutMethods = Boolean(account?.policies?.COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS);

  const recentContributionsFilter = useQueryFilter({ schema: recentTransactionsSchema, filters: {}, skipRouter: true });
  const recentPayoutsFilter = useQueryFilter({ schema: recentTransactionsSchema, filters: {}, skipRouter: true });

  const recentContributionsQuery = useQuery(transactionsTableQuery, {
    variables: {
      account: [{ id: account?.id }],
      hostAccount: { slug: hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: true,
      sort: { field: 'CREATED_AT', direction: 'DESC' },
      limit: 5,
      offset: 0,
      type: TransactionType.CREDIT,
      kind: [TransactionKind.CONTRIBUTION, TransactionKind.ADDED_FUNDS],
    },
    skip: !account?.id,
    notifyOnNetworkStatusChange: true,
  });
  const recentPayoutsQuery = useQuery(transactionsTableQuery, {
    variables: {
      account: [{ id: account?.id }],
      hostAccount: { slug: hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: true,
      sort: { field: 'CREATED_AT', direction: 'DESC' },
      limit: 5,
      offset: 0,
      type: TransactionType.DEBIT,
      kind: [TransactionKind.EXPENSE],
    },
    skip: !account?.id,
    notifyOnNetworkStatusChange: true,
  });

  const metricsDateRange = React.useMemo(
    () => ({ from: '2015-01-01T00:00:00.000Z', to: dayjs.utc().toISOString() }),
    [],
  );
  const financialActivityQuery = useQuery<
    HostedAccountFinancialActivityQuery,
    HostedAccountFinancialActivityQueryVariables
  >(hostedAccountFinancialActivityQuery, {
    variables: {
      hostSlug,
      dateRange: metricsDateRange,
      timeUnit: 'MONTH' as HostedAccountFinancialActivityQueryVariables['timeUnit'],
      accountFilter: { mainAccount: { eq: { id: account?.id } } },
      groupByAccount: false,
    },
    skip: !account?.id || !hostSlug,
    fetchPolicy: 'cache-and-network',
  });

  const metricsRows = React.useMemo(
    () => financialActivityQuery.data?.host?.metrics?.consolidated?.rows ?? [],
    [financialActivityQuery.data],
  );
  const metricsCurrency = financialActivityQuery.data?.host?.currency ?? currency;
  const receivedTimeSeries = React.useMemo(
    () =>
      buildKindActivity(metricsRows, {
        amountMeasure: 'amountReceived',
        countMeasure: 'contributionsCount',
        timeUnit: 'MONTH',
        dateFrom: metricsDateRange.from,
        dateTo: metricsDateRange.to,
        currency: metricsCurrency,
      }).timeSeries,
    [metricsRows, metricsDateRange, metricsCurrency],
  );
  const spentTimeSeries = React.useMemo(
    () =>
      buildKindActivity(metricsRows, {
        amountMeasure: 'amountSpent',
        countMeasure: 'payoutsCount',
        timeUnit: 'MONTH',
        dateFrom: metricsDateRange.from,
        dateTo: metricsDateRange.to,
        currency: metricsCurrency,
      }).timeSeries,
    [metricsRows, metricsDateRange, metricsCurrency],
  );

  const handleRowClick = (tx: RecentTransaction) => {
    if (tx.expense) {
      setOpenExpenseId(tx.expense.legacyId);
    } else if (tx.order) {
      setOpenContributionId(tx.order.legacyId);
    }
  };

  const handleTransactionTableRowClick: TransactionsTableProps['onClickRow'] = row => {
    if ('expense' in row.original && row.original.expense) {
      setOpenExpenseId(row.original.expense.legacyId);
      return true;
    } else if ('order' in row.original && row.original.order) {
      setOpenContributionId(row.original.order.legacyId);
      return true;
    }
    return false;
  };

  const adminMembers = account?.members?.nodes || [];
  const pendingInvitations = (account as any)?.memberInvitations || [];
  const isHostedCollective = Boolean(host?.id && account?.host?.id === host?.id);
  const canManageInvitationsAsHostAdmin = Boolean(
    isHostedCollective &&
    adminMembers.length === 0 &&
    LoggedInUser?.isHostAdmin(account) &&
    !LoggedInUser?.isAdminOfCollective(account),
  );
  const admins = adminMembers;
  const firstInteraction = account?.firstTransaction?.nodes?.[0];
  const latestInteraction = [account?.recentContributions?.nodes?.[0], account?.recentPayouts?.nodes?.[0]]
    .filter(Boolean)
    .sort((a, b) => +new Date(b.clearedAt || b.createdAt) - +new Date(a.clearedAt || a.createdAt))[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardContentCard
          title={<FormattedMessage defaultMessage="Details" id="Details" />}
          action={
            <Button
              variant="outline"
              size="icon-xs"
              aria-label={intl.formatMessage({ defaultMessage: 'Edit', id: 'Edit' })}
              onClick={() => setEditSettingsOpen(true)}
            >
              <Pencil size={16} />
            </Button>
          }
        >
          <DataList className="text-sm">
            <DataListItem
              label={<FormattedMessage defaultMessage="Name" id="Fields.name" />}
              value={account?.name || account?.slug}
            />
            {account?.tags?.length > 0 && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Tags" id="Tags" />}
                value={
                  <div className="flex flex-wrap gap-1">
                    {account.tags.map(tag => (
                      <Badge key={tag} size="xs" type="outline">
                        <I18nCollectiveTags tags={tag} />
                      </Badge>
                    ))}
                  </div>
                }
              />
            )}
            {account?.socialLinks?.length > 0 && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Social Links" id="3bLmoU" />}
                value={<HeroSocialLinks className="size-6" socialLinks={account.socialLinks} />}
              />
            )}
            {(account?.location?.address || account?.location?.country) && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Location" id="SectionLocation.Title" />}
                value={<LocationAddress location={account.location} />}
              />
            )}
            {isHosted && host && (
              <React.Fragment>
                <DataListItem
                  label={<FormattedMessage defaultMessage="Fee structure" id="FeeStructure" />}
                  value={
                    <span className="text-foreground">
                      {typeof hostFeePercent === 'number' ? `${hostFeePercent}%` : '—'}
                      {hostFeeStructureLabel ? ` (${hostFeeStructureLabel})` : ''}
                    </span>
                  }
                />
                <DataListItem
                  label={<FormattedMessage defaultMessage="Expense Types" id="D+aS5Z" />}
                  value={
                    <span className="text-foreground">
                      {isEmpty(accountExpenseTypes) ? (
                        <FormattedMessage defaultMessage="Use global settings" id="BXVJAo" />
                      ) : enabledExpenseTypes.length ? (
                        enabledExpenseTypes.join(', ')
                      ) : (
                        <FormattedMessage defaultMessage="Custom" id="Sjo1P4" />
                      )}
                    </span>
                  }
                />
              </React.Fragment>
            )}
            <DataListItem
              label={<FormattedMessage defaultMessage="Payout Methods" id="1F/08O" />}
              value={
                account?.policies ? (
                  <span className="text-foreground">
                    {adminsCanSeePayoutMethods ? (
                      <FormattedMessage defaultMessage="Visible" id="/TlAIY" />
                    ) : (
                      <FormattedMessage defaultMessage="Hidden" id="ThUvIL" />
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
          </DataList>
        </DashboardContentCard>

        <DashboardContentCard title={<FormattedMessage defaultMessage="Platform Activity" id="PlatformActivity" />}>
          <DataList className="text-sm">
            <DataListItem
              label={<FormattedMessage defaultMessage="Status" id="Status" />}
              value={
                account?.isFrozen ? (
                  <Badge size="sm" type="info">
                    <FormattedMessage id="CollectiveStatus.Frozen" defaultMessage="Frozen" />
                  </Badge>
                ) : (
                  <Badge size="sm" type="success">
                    <FormattedMessage defaultMessage="Active" id="Subscriptions.Active" />
                  </Badge>
                )
              }
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="Applied On" id="AppliedOn" />}
              value={account?.createdAt ? <FormattedDate value={account.createdAt} dateStyle="long" /> : '—'}
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="Accepted On" id="AcceptedOn" />}
              value={
                account?.approvedAt ? (
                  <FormattedDate value={account.approvedAt} dateStyle="long" />
                ) : (
                  <FormattedMessage defaultMessage="Not Hosted" id="OARQHL" />
                )
              }
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="First Interaction" id="/DiN97" />}
              value={<InteractionValue tx={firstInteraction} onOpen={handleRowClick} />}
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="Latest Interaction" id="SQ9JvS" />}
              value={<InteractionValue tx={latestInteraction} onOpen={handleRowClick} />}
            />
          </DataList>
        </DashboardContentCard>
      </div>

      <DashboardContentCard title={<FormattedMessage defaultMessage="About" id="collective.about.title" />}>
        {(account?.description || admins.length > 0 || pendingInvitations.length > 0) && (
          <DataList className="text-sm">
            {account?.description && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Description" id="Fields.description" />}
                value={<span className="text-foreground">{account.description}</span>}
              />
            )}
            {(admins.length > 0 || pendingInvitations.length > 0) && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Admins" id="Admins" />}
                value={
                  <div className="flex flex-wrap items-baseline gap-2" data-cy="admins-list">
                    {admins.map(admin => (
                      <Badge key={admin.id} size="sm" type="outline" className="truncate text-nowrap">
                        <LinkCollective
                          collective={admin.account}
                          withHoverCard
                          className="flex items-center gap-1 text-nowrap"
                        >
                          <Avatar collective={admin.account} size={16} />
                          <span className="truncate">{admin.account.name || admin.account.slug}</span>
                        </LinkCollective>
                      </Badge>
                    ))}
                    {pendingInvitations.map(invitation => (
                      <Tooltip key={invitation.id}>
                        <TooltipTrigger asChild>
                          <button
                            className="group ml-1 flex items-center text-muted-foreground"
                            onClick={() => setInvitationToCancel(invitation)}
                            data-cy="cancel-invitation-btn"
                            aria-label={intl.formatMessage({
                              defaultMessage: 'Cancel invitation',
                              id: 'CancelInvitation',
                            })}
                          >
                            <Badge size="sm" type="outline" className="truncate text-nowrap">
                              <div className="flex items-center gap-1 text-nowrap">
                                <Avatar collective={invitation.memberAccount} size={16} />
                                <span className="truncate">
                                  {invitation.memberAccount?.name || invitation.memberAccount?.slug}
                                </span>

                                {canManageInvitationsAsHostAdmin && (
                                  <div className="flex items-center">
                                    <MailMinus className="hidden text-red-600 group-hover:inline" size={14} />
                                    <Mail className="group-hover:hidden" size={14} />
                                  </div>
                                )}
                              </div>
                            </Badge>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <FormattedMessage defaultMessage="Cancel invitation" id="CancelInvitation" />
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                }
              />
            )}
          </DataList>
        )}
      </DashboardContentCard>

      <DashboardContentCard title={<FormattedMessage defaultMessage="Overview" id="AdminPanel.Menu.Overview" />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Metric
            label={<FormattedMessage defaultMessage="Current Balance" id="PkACGs" />}
            amount={isChild ? stats?.balance : stats?.consolidatedBalance}
            currency={currency}
          />
          <Metric
            label={<FormattedMessage defaultMessage="Received by Account (all-time)" id="26sbkf" />}
            amount={stats?.consolidatedTotalNetAmountRaised}
            currency={currency}
            onClick={() => openTab(HostedAccountView.MONEY_MOVEMENTS, 'CONTRIBUTIONS')}
          />
          <Metric
            label={<FormattedMessage defaultMessage="Disbursed by account (all-time)" id="3wX8nB" />}
            amount={stats?.consolidatedTotalAmountSpent}
            currency={currency}
            onClick={() => openTab(HostedAccountView.MONEY_MOVEMENTS, 'PAYOUTS')}
          />
        </div>
        <div className="h-72 w-full">
          <HostedAccountOverviewChart
            currency={currency as any}
            series={[
              {
                name: intl.formatMessage({ defaultMessage: 'Balance', id: 'Balance' }),
                color: BALANCE_COLOR,
                data: stats?.balanceTimeSeries,
              },
              {
                name: intl.formatMessage({ defaultMessage: 'Received by account', id: 'C22hxu' }),
                color: RECEIVED_COLOR,
                data: receivedTimeSeries,
              },
              {
                name: intl.formatMessage({ defaultMessage: 'Spent by account', id: 'bXI/iJ' }),
                color: SPENT_COLOR,
                data: spentTimeSeries,
              },
            ]}
          />
        </div>
      </DashboardContentCard>

      <HostedAccountContributionsPayoutsSection account={account} hostSlug={hostSlug} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentTransactionsCard
          title={<FormattedMessage defaultMessage="Recent Contributions" id="BPg/ek" />}
          transactions={recentContributionsQuery.data?.transactions}
          loading={recentContributionsQuery.loading}
          queryFilter={recentContributionsFilter}
          refetch={recentContributionsQuery.refetch}
          onRowClick={handleTransactionTableRowClick}
          onViewAll={() => openTab(HostedAccountView.MONEY_MOVEMENTS, 'CONTRIBUTIONS')}
        />
        <RecentTransactionsCard
          title={<FormattedMessage defaultMessage="Recent Payouts" id="aS3BD9" />}
          transactions={recentPayoutsQuery.data?.transactions}
          loading={recentPayoutsQuery.loading}
          queryFilter={recentPayoutsFilter}
          refetch={recentPayoutsQuery.refetch}
          onRowClick={handleTransactionTableRowClick}
          onViewAll={() => openTab(HostedAccountView.MONEY_MOVEMENTS, 'PAYOUTS')}
        />
      </div>

      <EditCollectiveSettingsModal
        open={isEditSettingsOpen}
        onOpenChange={setEditSettingsOpen}
        account={account}
        host={host}
      />

      {invitationToCancel && (
        <ConfirmationModal
          open={Boolean(invitationToCancel)}
          setOpen={open => !open && setInvitationToCancel(null)}
          type="delete"
          variant="destructive"
          title={
            <FormattedMessage
              defaultMessage="Cancel invitation for {name}?"
              id="CancelInvitation.title"
              values={{ name: invitationToCancel.memberAccount?.name }}
            />
          }
          description={
            <FormattedMessage
              defaultMessage="The pending invitation will be removed. You can invite this user again later."
              id="CancelInvitation.description"
            />
          }
          onConfirm={async () => {
            try {
              await cancelMemberInvitation({
                variables: { invitation: { id: invitationToCancel.id } },
              });
              await refetch?.();
              setInvitationToCancel(null);
            } catch (e) {
              e.message = i18nGraphqlException(intl, e);
              throw e;
            }
          }}
        />
      )}
      {openExpenseId && (
        <ExpenseDrawer openExpenseLegacyId={openExpenseId} handleClose={() => setOpenExpenseId(null)} />
      )}
      {openContributionId && (
        <ContributionDrawer
          open
          onClose={() => setOpenContributionId(null)}
          orderId={openContributionId}
          getActions={() => ({})}
        />
      )}
    </div>
  );
}
