import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { isEmpty } from 'lodash-es';
import { Mail, MailMinus, Pencil } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '@/lib/errors';
import type {
  HostedAccountOverviewMetricsQuery,
  HostedAccountOverviewMetricsQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import { TimeUnit } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { i18nExpenseType } from '@/lib/i18n/expense';
import { formatHostFeeStructure } from '@/lib/i18n/host-fee-structure';

import Avatar from '@/components/Avatar';
import { ContributionDrawer } from '@/components/contributions/ContributionDrawer';
import HeroSocialLinks from '@/components/crowdfunding-redesign/SocialLinks';
import { DashboardContentCard } from '@/components/dashboard/DashboardContentCard';
import { Filterbar } from '@/components/dashboard/filters/Filterbar';
import { periodCompareFilter } from '@/components/dashboard/filters/PeriodCompareFilter';
import DateTime from '@/components/DateTime';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import I18nCollectiveTags from '@/components/I18nCollectiveTags';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import { Metric, type MetricProps } from '@/components/metrics';
import ConfirmationModal from '@/components/NewConfirmationModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataList, DataListItem } from '@/components/ui/DataList';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

import { EditCollectiveSettingsModal } from './EditCollectiveSettingsModal';
import { HostedAccountContributionsPayoutsSection } from './HostedAccountContributionsPayoutsSection';
import { hostedAccountOverviewMetricsQuery } from './queries';
import { RecentContributionsCard } from './RecentContributionsCard';
import { RecentPayoutsCard } from './RecentPayoutsCard';
import type { HostedAccountProfileData, MoneyMovementsView } from './types';
import { HostedAccountView } from './types';

const financialsSchema = z.object({
  period: periodCompareFilter.schema,
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

export function HostedAccountOverviewTab({ account, host, hostSlug, openTab, refetch }: HostedAccountOverviewTabProps) {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const openMoneyView = (view: MoneyMovementsView) => openTab(HostedAccountView.PAYMENT_INTENTS, view);
  const queryFilter = useQueryFilter<typeof financialsSchema, HostedAccountOverviewMetricsQueryVariables>({
    schema: financialsSchema,
    toVariables: {
      period: periodCompareFilter.toVariables,
    },
    filters: {
      period: periodCompareFilter.filter,
    },
  });
  const statsQuery = useQuery<HostedAccountOverviewMetricsQuery, HostedAccountOverviewMetricsQueryVariables>(
    hostedAccountOverviewMetricsQuery,
    {
      variables: {
        accountId: account?.id ?? '',
        includeComparison: queryFilter.variables.includeComparison ?? false,
        ...queryFilter.variables,
      },
      skip: !account?.id,
      fetchPolicy: 'cache-and-network',
    },
  );
  const statsAccount = statsQuery.data?.account;
  const statsLoading = statsQuery.loading && !statsQuery.data;
  const [openExpenseId, setOpenExpenseId] = React.useState<number | null>(null);
  const [openContributionId, setOpenContributionId] = React.useState<number | null>(null);
  const [isEditSettingsOpen, setEditSettingsOpen] = React.useState(false);
  const [invitationToCancel, setInvitationToCancel] = React.useState(null);
  const [cancelMemberInvitation] = useMutation(cancelMemberInvitationMutation);

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

  const handleRowClick = (tx: RecentTransaction) => {
    if (tx.expense) {
      setOpenExpenseId(tx.expense.legacyId);
    } else if (tx.order) {
      setOpenContributionId(tx.order.legacyId);
    }
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

  const metrics: (MetricProps & { id: string })[] = [
    {
      id: 'balance',
      className: 'col-span-1 row-span-2',
      label: <FormattedMessage id="TotalBalance" defaultMessage="Total Balance" />,
      helpLabel: (
        <FormattedMessage defaultMessage="Balance at end of this period, including starting balance" id="hi/nhW" />
      ),
      timeseries: {
        ...statsAccount?.balanceTimeseries,
        currency: statsAccount?.balance?.current?.currency,
      },
      amount: statsAccount?.balance,
      showCurrencyCode: true,
      isSnapshot: true,
      showTimeSeries: true,
      noTimeseriesLabel: <FormattedMessage defaultMessage="No data for selected period" id="Metric.NoDataForperiod" />,
    },
    {
      id: 'received',
      label: <FormattedMessage defaultMessage="Received" id="z/wUXE" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount received this period" id="2kY5p5" />,
      amount: statsAccount?.received,
      timeseries: {
        ...statsAccount?.receivedTimeseries,
        currency: statsAccount?.received?.current?.currency,
      },
      showTimeSeries: true,
    },
    {
      id: 'spent',
      useAbsoluteAmount: true,
      label: <FormattedMessage defaultMessage="Spent" id="111qQK" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount spent this period" id="6ctWuQ" />,
      amount: statsAccount?.spent,
    },
    {
      id: 'contributions',
      label: <FormattedMessage id="Contributions" defaultMessage="Contributions" />,
      count: statsAccount?.contributionsCount,
      hide: Boolean(statsAccount) && !statsAccount.isActive,
    },
  ];

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

      <div className="space-y-3">
        <Filterbar hideSeparator {...queryFilter} />
        <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3">
          {metrics
            .filter(metric => !metric.hide)
            .map(metric => (
              <Metric key={metric.id} {...metric} loading={statsLoading} />
            ))}
        </div>
      </div>

      <HostedAccountContributionsPayoutsSection
        account={account}
        hostSlug={hostSlug}
        dateFrom={queryFilter.variables.dateFrom}
        dateTo={queryFilter.variables.dateTo}
        timeUnit={queryFilter.variables.timeUnit ?? TimeUnit.MONTH}
        received={statsAccount?.received}
        spent={statsAccount?.spent}
        contributionsCount={statsAccount?.contributionsCount}
        statsLoading={statsLoading}
      />

      <div className="space-y-3">
        <h3 className="text-lg font-bold">
          <FormattedMessage defaultMessage="Latest activity" id="hostedAccount.latestActivity" />
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecentContributionsCard
            account={account}
            hostSlug={hostSlug}
            onViewAll={() => openMoneyView('CONTRIBUTIONS')}
          />
          <RecentPayoutsCard account={account} hostSlug={hostSlug} onViewAll={() => openMoneyView('PAYOUTS')} />
        </div>
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
