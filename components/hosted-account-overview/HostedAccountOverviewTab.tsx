import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '@/lib/constants/collectives';

import Avatar from '@/components/Avatar';
import HeroSocialLinks from '@/components/collective-page/hero/HeroSocialLinks';
import { ContributionDrawer } from '@/components/contributions/ContributionDrawer';
import {
  AdminsCanSeePayoutMethodsSwitch,
  ExpenseTypesPicker,
  HostFeeStructurePicker,
} from '@/components/dashboard/sections/collectives/CollectiveDetails';
import DateTime from '@/components/DateTime';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import I18nCollectiveTags from '@/components/I18nCollectiveTags';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataList, DataListItem } from '@/components/ui/DataList';

import type { MoneyMovementsView } from './HostedAccountMoneyMovementsTab';
import { HostedAccountOverviewChart } from './HostedAccountOverviewChart';
import type { HostedAccountProfileData } from './types';
import { HostedAccountView } from './types';

const BALANCE_COLOR = '#f59e0b';
const RECEIVED_COLOR = '#14b8a6';

type RecentTransaction = NonNullable<HostedAccountProfileData['recentContributions']>['nodes'][number];

type HostedAccountOverviewTabProps = {
  account?: HostedAccountProfileData;
  host?: { id?: string; hostFeePercent?: number | null } | null;
  openTab: (tab: HostedAccountView, moneyMovementsView?: MoneyMovementsView) => void;
};

const SectionCard = ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">{children}</CardContent>
  </Card>
);

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
      <DateTime value={tx.clearedAt || tx.createdAt} dateStyle="medium" />
      {' • '}
      {tx.type === 'CREDIT' ? (
        <FormattedMessage
          defaultMessage="Made a <link>{amount} contribution {ref}</link>"
          id="HostedAccount.interaction.contribution"
          values={{ amount, ref, link }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="Made a <link>{amount} payout {ref}</link>"
          id="HostedAccount.interaction.payout"
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
  rows,
  showDescription,
  currency,
  onRowClick,
  onViewAll,
}: {
  title: React.ReactNode;
  rows: RecentTransaction[];
  showDescription?: boolean;
  currency?: string;
  onRowClick: (tx: RecentTransaction) => void;
  onViewAll: () => void;
}) => (
  <SectionCard title={title}>
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-muted-foreground">
          <th className="pr-6 pb-2 font-medium">
            <FormattedMessage defaultMessage="Date Paid" id="Gh3Obs.date" />
          </th>
          <th className="pr-6 pb-2 font-medium">
            <FormattedMessage defaultMessage="Contribution to" id="kQwHjA" />
          </th>
          <th className="pr-6 pb-2 font-medium">
            <FormattedMessage defaultMessage="Account" id="TwyMau" />
          </th>
          <th className="pb-2 text-right font-medium">
            <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={4} className="py-4 text-center text-muted-foreground">
              <FormattedMessage defaultMessage="No data" id="UG5qoS" />
            </td>
          </tr>
        ) : (
          rows.map(tx => {
            const canOpen = Boolean(tx.expense || tx.order);
            return (
              <tr
                key={tx.id}
                className={`border-t border-gray-100 ${canOpen ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                onClick={canOpen ? () => onRowClick(tx) : undefined}
              >
                <td className="py-2.5 pr-6 whitespace-nowrap text-foreground">
                  <DateTime value={tx.clearedAt || tx.createdAt} dateStyle="medium" />
                </td>
                <td className="py-2.5 pr-6">
                  {showDescription ? (
                    <span className="line-clamp-1 text-foreground">{tx.description || '—'}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Avatar collective={tx.oppositeAccount} radius={20} />
                      <span className="line-clamp-1 text-foreground">{tx.oppositeAccount?.name || '—'}</span>
                    </div>
                  )}
                </td>
                <td className="py-2.5 pr-6">
                  <div className="flex items-center gap-2">
                    <Avatar collective={tx.account} radius={20} />
                    <span className="line-clamp-1 text-foreground">{tx.account?.name || '—'}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right font-medium whitespace-nowrap text-foreground">
                  <FormattedMoneyAmount
                    amount={tx.netAmount.valueInCents}
                    currency={tx.netAmount.currency || currency}
                    showCurrencyCode
                    precision={2}
                  />
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
    <Button variant="ghost" size="sm" className="self-center" onClick={onViewAll}>
      <FormattedMessage defaultMessage="View all" id="ViewAll" />
      <ArrowRight size={14} />
    </Button>
  </SectionCard>
);

export function HostedAccountOverviewTab({ account, host, openTab }: HostedAccountOverviewTabProps) {
  const intl = useIntl();
  const [openExpenseId, setOpenExpenseId] = React.useState<number | null>(null);
  const [openContributionId, setOpenContributionId] = React.useState<number | null>(null);

  const currency = account?.currency;
  const stats = account?.stats;
  const isChild = Boolean(account?.parent?.id);
  const isHosted = Boolean(account?.host?.id);

  const handleRowClick = (tx: RecentTransaction) => {
    if (tx.expense) {
      setOpenExpenseId(tx.expense.legacyId);
    } else if (tx.order) {
      setOpenContributionId(tx.order.legacyId);
    }
  };

  const admins = account?.members?.nodes || [];
  const firstInteraction = account?.firstTransaction?.nodes?.[0];
  const latestInteraction = [account?.recentContributions?.nodes?.[0], account?.recentPayouts?.nodes?.[0]]
    .filter(Boolean)
    .sort((a, b) => +new Date(b.clearedAt || b.createdAt) - +new Date(a.clearedAt || a.createdAt))[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={<FormattedMessage defaultMessage="Details" id="Details" />}>
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
                value={
                  <div className="flex flex-wrap items-center gap-2">
                    <HeroSocialLinks socialLinks={account.socialLinks} />
                  </div>
                }
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
                  value={<HostFeeStructurePicker collective={account as any} host={host as any} />}
                />
                <DataListItem
                  label={<FormattedMessage defaultMessage="Expense Types" id="D+aS5Z" />}
                  value={<ExpenseTypesPicker collective={account as any} host={host as any} />}
                />
              </React.Fragment>
            )}
            <DataListItem
              label={<FormattedMessage defaultMessage="Show payout method details" id="3P4Al8" />}
              value={
                account?.policies ? (
                  <div className="flex flex-col gap-1.5">
                    <AdminsCanSeePayoutMethodsSwitch collective={account as any} />
                    <p className="text-xs text-muted-foreground">
                      {account?.type === CollectiveType.FUND ? (
                        <FormattedMessage
                          defaultMessage="Allow Fund Admins to view sensitive payout method details of payees"
                          id="om2juz"
                        />
                      ) : (
                        <FormattedMessage
                          defaultMessage="Allow Collective Admins to view sensitive payout method details of payees"
                          id="N+kkx3"
                        />
                      )}
                    </p>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
          </DataList>
        </SectionCard>

        <SectionCard title={<FormattedMessage defaultMessage="Platform Activity" id="PlatformActivity" />}>
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
              value={account?.createdAt ? <FormattedDate value={account.createdAt} dateStyle="medium" /> : '—'}
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="Accepted On" id="AcceptedOn" />}
              value={
                account?.approvedAt ? (
                  <FormattedDate value={account.approvedAt} dateStyle="medium" />
                ) : (
                  <FormattedMessage defaultMessage="Not Hosted" id="OARQHL" />
                )
              }
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="First Interaction" id="FirstInteraction" />}
              value={<InteractionValue tx={firstInteraction} onOpen={handleRowClick} />}
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="Latest Interaction" id="LatestInteraction" />}
              value={<InteractionValue tx={latestInteraction} onOpen={handleRowClick} />}
            />
          </DataList>
        </SectionCard>
      </div>

      <SectionCard title={<FormattedMessage defaultMessage="About" id="collective.about.title" />}>
        {account?.description && <p className="text-sm text-foreground">{account.description}</p>}
        {admins.length > 0 && (
          <DataList className="text-sm">
            <DataListItem
              label={<FormattedMessage defaultMessage="Admins" id="Admins" />}
              value={
                <div className="flex flex-wrap gap-3">
                  {admins.map(admin => (
                    <LinkCollective
                      key={admin.id}
                      collective={admin.account}
                      className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                      withHoverCard
                    >
                      <Avatar collective={admin.account} radius={20} /> {admin.account.name}
                    </LinkCollective>
                  ))}
                </div>
              }
            />
          </DataList>
        )}
      </SectionCard>

      <SectionCard title={<FormattedMessage defaultMessage="Overview" id="AdminPanel.Menu.Overview" />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Metric
            label={<FormattedMessage defaultMessage="Current Balance" id="CurrentBalance" />}
            amount={isChild ? stats?.balance : stats?.consolidatedBalance}
            currency={currency}
          />
          <Metric
            label={<FormattedMessage defaultMessage="Received by Account (all-time)" id="ReceivedAllTime" />}
            amount={stats?.consolidatedTotalNetAmountRaised}
            currency={currency}
            onClick={() => openTab(HostedAccountView.MONEY_MOVEMENTS, 'CONTRIBUTIONS')}
          />
          <Metric
            label={<FormattedMessage defaultMessage="Disbursed by account (all-time)" id="DisbursedAllTime" />}
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
                name: intl.formatMessage({ defaultMessage: 'Received by account', id: 'ReceivedByAccount' }),
                color: RECEIVED_COLOR,
                data: stats?.totalAmountReceivedTimeSeries,
              },
            ]}
          />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentTransactionsCard
          title={<FormattedMessage defaultMessage="Recent Contributions" id="RecentContributions" />}
          rows={account?.recentContributions?.nodes || []}
          currency={currency}
          onRowClick={handleRowClick}
          onViewAll={() => openTab(HostedAccountView.MONEY_MOVEMENTS, 'CONTRIBUTIONS')}
        />
        <RecentTransactionsCard
          title={<FormattedMessage defaultMessage="Recent Payouts" id="RecentPayouts" />}
          rows={account?.recentPayouts?.nodes || []}
          showDescription
          currency={currency}
          onRowClick={handleRowClick}
          onViewAll={() => openTab(HostedAccountView.MONEY_MOVEMENTS, 'PAYOUTS')}
        />
      </div>

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
