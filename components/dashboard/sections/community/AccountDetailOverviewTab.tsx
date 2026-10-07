import React from 'react';
import type { QueryResult } from '@apollo/client';
import { gql, useMutation, useQuery } from '@apollo/client';
import { compact, isEmpty } from 'lodash-es';
import { Mail, MailMinus, Pencil } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '@/lib/errors';
import { limit, offset } from '@/lib/filters/schemas';
import type { CommunityAccountDetailQuery, CommunityAccountOverviewQuery } from '@/lib/graphql/types/v2/graphql';
import { AccountType, CommunityRelationType, TransactionType } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import formatCollectiveType from '@/lib/i18n/collective-type';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';
import { i18nExpenseType } from '@/lib/i18n/expense';
import { formatHostFeeStructure } from '@/lib/i18n/host-fee-structure';
import { getCollectivePageCanonicalURL } from '@/lib/url-helpers';

import { CopyID } from '@/components/CopyId';
import { DashboardContentCard } from '@/components/dashboard/DashboardContentCard';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
// Transitional import: EditCollectiveSettingsModal is copied over from hosted-account-overview later.
import { EditCollectiveSettingsModal } from '@/components/hosted-account-overview/EditCollectiveSettingsModal';
// Transitional import: SocialLinks is copied over from hosted-account-overview later.
import HeroSocialLinks from '@/components/hosted-account-overview/SocialLinks';
import I18nCollectiveTags from '@/components/I18nCollectiveTags';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import ConfirmationModal from '@/components/NewConfirmationModal';
import StackedAvatars from '@/components/StackedAvatars';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataList, DataListItem } from '@/components/ui/DataList';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { getEffectiveVendorPolicyLabel, VendorContactTag } from '@/components/vendors/common';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import { Metric } from '../overview/Metric';
import { transactionsTableQuery } from '../transactions/queries';
import type { TransactionsTableProps } from '../transactions/TransactionsTable';
import TransactionsTable from '../transactions/TransactionsTable';

import { AccountDetailView, HOSTED_ACCOUNT_TYPES, TaxableCountry } from './common';
import { HostedFinancialSummaryCard } from './HostedFinancialSummaryCard';
import { type AccountDetailData, type AccountDetailHost, communityAccountOverviewQuery } from './queries';

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

type RecentTransaction = NonNullable<AccountDetailData['recentContributions']>['nodes'][number];

const cancelMemberInvitationMutation = gql`
  mutation CancelMemberInvitationInAccountDetail($invitation: MemberInvitationReferenceInput!) {
    cancelMemberInvitation(invitation: $invitation)
  }
`;

// First/latest interaction rendering from the hosted account overview version.
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

const HostedAccountDetailsCard = ({
  account,
  host,
  onEditSettings,
}: {
  account?: AccountDetailData;
  host?: AccountDetailHost;
  onEditSettings?: () => void;
}) => {
  const intl = useIntl();
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
  return (
    <DashboardContentCard
      title={<FormattedMessage defaultMessage="Details" id="Details" />}
      action={
        onEditSettings ? (
          <Button
            variant="outline"
            size="icon-xs"
            aria-label={intl.formatMessage({ defaultMessage: 'Edit', id: 'Edit' })}
            onClick={onEditSettings}
          >
            <Pencil size={16} />
          </Button>
        ) : null
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
  );
};

const CommunityDetailsCard = ({
  account,
  host,
  isLoading,
  expectedAccountType,
  onEditVendor,
}: {
  account?: AccountDetailData;
  host?: Parameters<typeof getEffectiveVendorPolicyLabel>[1];
  isLoading: boolean;
  expectedAccountType?: AccountType;
  onEditVendor?: () => void;
}) => {
  const intl = useIntl();
  const vendorInfo = account?.type === 'VENDOR' ? account['vendorInfo'] : null;
  return (
    <DashboardContentCard
      title={<FormattedMessage defaultMessage="Details" id="Details" />}
      action={
        account?.type === 'VENDOR' && onEditVendor ? (
          <Button
            variant="outline"
            size="icon-xs"
            aria-label={intl.formatMessage({ defaultMessage: 'Edit', id: 'Edit' })}
            onClick={onEditVendor}
            data-cy="edit-vendor-button"
          >
            <Pencil size={16} />
          </Button>
        ) : null
      }
    >
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
        <TaxableCountry
          accountType={account?.type || expectedAccountType}
          taxableCountry={account?.taxableCountry}
          isUSEntity={account?.isUSEntity}
          isLoading={isLoading}
        />
        {account?.socialLinks?.length > 0 && (
          <DataListItem
            label={<FormattedMessage defaultMessage="Social Links" id="3bLmoU" />}
            value={<HeroSocialLinks className="size-6" socialLinks={account.socialLinks} />}
          />
        )}
        {account?.type === AccountType.VENDOR && vendorInfo && (
          <React.Fragment>
            <DataListItem
              label={<FormattedMessage id="ContributorProfile" defaultMessage="Contributor Profile" />}
              value={
                'hasPublicProfile' in account && account.hasPublicProfile ? (
                  <CopyID
                    tooltipLabel={<FormattedMessage defaultMessage="Copy URL" id="P8QaSQ" />}
                    value={getCollectivePageCanonicalURL(account)}
                    className="flex items-center gap-1"
                  >
                    <span className="truncate">{getCollectivePageCanonicalURL(account)}</span>
                  </CopyID>
                ) : (
                  <span className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Disabled" id="tthToS" />
                  </span>
                )
              }
            />
            <DataListItem
              label={<FormattedMessage defaultMessage="Visible to" id="zJePa1" />}
              value={
                'canBeUsedWithAccounts' in account && account.canBeUsedWithAccounts.length > 0 ? (
                  <StackedAvatars
                    accounts={account.canBeUsedWithAccounts}
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
                  host={host}
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
    </DashboardContentCard>
  );
};

const PlatformActivityCard = ({
  account,
  isHostedAccount,
  relations,
  onOpenInteraction,
}: {
  account?: AccountDetailData;
  isHostedAccount: boolean;
  relations: CommunityRelationType[];
  onOpenInteraction: (tx: RecentTransaction) => void;
}) => {
  const intl = useIntl();
  const firstInteraction = account?.firstTransaction?.nodes?.[0];
  const latestInteraction = [account?.recentContributions?.nodes?.[0], account?.recentPayouts?.nodes?.[0]]
    .filter(Boolean)
    .sort((a, b) => +new Date(b.clearedAt || b.createdAt) - +new Date(a.clearedAt || a.createdAt))[0];
  return (
    <DashboardContentCard title={<FormattedMessage defaultMessage="Platform Activity" id="PlatformActivity" />}>
      <DataList className="text-sm">
        {isHostedAccount && (
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
        )}
        {isHostedAccount ? (
          <DataListItem
            label={<FormattedMessage defaultMessage="Applied On" id="AppliedOn" />}
            value={account?.createdAt ? <FormattedDate value={account.createdAt} dateStyle="long" /> : '—'}
          />
        ) : (
          <DataListItem
            label={
              account?.type === 'VENDOR' ? (
                <FormattedMessage id="agreement.createdOn" defaultMessage="Created on" />
              ) : (
                <FormattedMessage defaultMessage="Joined on" id="Vf1x2A" />
              )
            }
            value={account?.createdAt ? <DateTime value={account.createdAt} dateStyle="long" /> : '—'}
          />
        )}
        {isHostedAccount && (
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
        )}
        <DataListItem
          label={<FormattedMessage defaultMessage="First Interaction" id="/DiN97" />}
          value={<InteractionValue tx={firstInteraction} onOpen={onOpenInteraction} />}
        />
        <DataListItem
          label={<FormattedMessage defaultMessage="Latest Interaction" id="SQ9JvS" />}
          value={<InteractionValue tx={latestInteraction} onOpen={onOpenInteraction} />}
        />
        {!isHostedAccount && (
          <DataListItem
            label={<FormattedMessage defaultMessage="Roles" id="c35gM5" />}
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
          />
        )}
      </DataList>
    </DashboardContentCard>
  );
};

const AboutCard = ({
  account,
  host,
  refetch,
}: {
  account?: AccountDetailData;
  host?: AccountDetailHost;
  refetch?: () => void;
}) => {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const [invitationToCancel, setInvitationToCancel] = React.useState(null);
  const [cancelMemberInvitation] = useMutation(cancelMemberInvitationMutation);
  const admins = account?.members?.nodes || [];
  // Individuals show the accounts they administer ("Admin of") instead of admins.
  const isAdminOf = account?.type === AccountType.INDIVIDUAL;
  const adminOf = account && 'adminOf' in account ? account.adminOf?.nodes || [] : [];
  const displayedMembers = isAdminOf ? adminOf : admins;
  const pendingInvitations = (account as any)?.memberInvitations || [];
  const isHostedCollective = Boolean(host?.id && account?.host?.id === host?.id);
  const canManageInvitationsAsHostAdmin = Boolean(
    isHostedCollective &&
    admins.length === 0 &&
    LoggedInUser?.isHostAdmin(account) &&
    !LoggedInUser?.isAdminOfCollective(account),
  );
  if (!account?.description && displayedMembers.length === 0 && pendingInvitations.length === 0) {
    return null;
  }
  return (
    <React.Fragment>
      <DashboardContentCard title={<FormattedMessage defaultMessage="About" id="collective.about.title" />}>
        <DataList className="text-sm">
          {account?.description && (
            <DataListItem
              label={<FormattedMessage defaultMessage="Description" id="Fields.description" />}
              value={<span className="text-foreground">{account.description}</span>}
            />
          )}
          {(displayedMembers.length > 0 || pendingInvitations.length > 0) && (
            <DataListItem
              label={
                isAdminOf ? (
                  <FormattedMessage defaultMessage="Admin of" id="AdminOf" />
                ) : (
                  <FormattedMessage defaultMessage="Administrators" id="administrators" />
                )
              }
              value={
                <div className="flex flex-wrap items-baseline gap-2" data-cy="admins-list">
                  {displayedMembers.map(admin => (
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
      </DashboardContentCard>
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
    </React.Fragment>
  );
};

const FinancialSummaryCard = ({
  account,
  hostSlug,
  expectedAccountType,
  loading,
  handleTabChange,
  handleTransactionTableRowClick,
}: {
  account?: AccountDetailData;
  hostSlug: string;
  expectedAccountType?: AccountType;
  loading: boolean;
  handleTabChange: (tab: string) => void;
  handleTransactionTableRowClick: TransactionsTableProps['onClickRow'];
}) => {
  const intl = useIntl();

  const communityQuery = useQuery<CommunityAccountOverviewQuery>(communityAccountOverviewQuery, {
    variables: {
      accountId: account?.id,
      hostSlug,
    },
    skip: !account?.id || !hostSlug,
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
      fromAccount: { id: account?.id },
      hostAccount: { slug: hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: false,
      sort: { field: 'CREATED_AT', direction: 'DESC' },
      limit: 5,
      offset: 0,
      type: TransactionType.CREDIT,
    },
    skip: !account?.id || !hostSlug,
    notifyOnNetworkStatusChange: true,
  });

  const recentDebitsQuery = useQuery(transactionsTableQuery, {
    variables: {
      fromAccount: { id: account?.id },
      hostAccount: { slug: hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: false,
      sort: { field: 'CREATED_AT', direction: 'DESC' },
      limit: 5,
      offset: 0,
      type: TransactionType.DEBIT,
    },
    skip: !account?.id || !hostSlug,
    notifyOnNetworkStatusChange: true,
  });

  const isLoading = loading || communityQuery.loading;
  const name =
    account?.name ||
    account?.legalName ||
    account?.slug ||
    formatCollectiveType(intl, account?.type || expectedAccountType);
  const overviewAccount = communityQuery.data?.account;

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
  );
};

export const AccountDetailsOverviewTab = ({
  query,
  expectedAccountType,
  handleTabChange,
  handleTransactionTableRowClick,
  onEditVendor,
}: {
  query: QueryResult<CommunityAccountDetailQuery>;
  expectedAccountType: AccountType;
  handleTabChange: (tab: string) => void;
  handleTransactionTableRowClick: TransactionsTableProps['onClickRow'];
  onEditVendor?: () => void;
}) => {
  const isLoading = query.loading;
  const account = query.data?.account as AccountDetailData | undefined;
  const host = query.data?.host as AccountDetailHost | undefined;
  const isHostedAccount = HOSTED_ACCOUNT_TYPES.includes(account?.type);
  const relations = compact(account?.communityStats?.relations).filter(
    (relation, _, relations) => !(relation === 'EXPENSE_SUBMITTER' && relations.includes(CommunityRelationType.PAYEE)),
  );

  const [isEditSettingsOpen, setEditSettingsOpen] = React.useState(false);
  const openInteraction = React.useCallback(
    (tx: RecentTransaction) => {
      handleTransactionTableRowClick({
        original: tx,
      } as unknown as Parameters<TransactionsTableProps['onClickRow']>[0]);
    },
    [handleTransactionTableRowClick],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isHostedAccount ? (
          <HostedAccountDetailsCard account={account} host={host} onEditSettings={() => setEditSettingsOpen(true)} />
        ) : (
          <CommunityDetailsCard
            account={account}
            host={host}
            isLoading={isLoading}
            expectedAccountType={expectedAccountType}
            onEditVendor={onEditVendor}
          />
        )}
        <PlatformActivityCard
          account={account}
          isHostedAccount={isHostedAccount}
          relations={relations}
          onOpenInteraction={openInteraction}
        />
      </div>
      <AboutCard account={account} host={host} refetch={query.refetch} />
      {isHostedAccount ? (
        <HostedFinancialSummaryCard
          account={account}
          hostSlug={query.variables.hostSlug}
          loading={query.loading}
          handleTabChange={handleTabChange}
          handleTransactionTableRowClick={handleTransactionTableRowClick}
        />
      ) : (
        <FinancialSummaryCard
          account={account}
          hostSlug={query.variables.hostSlug}
          expectedAccountType={expectedAccountType}
          loading={query.loading}
          handleTabChange={handleTabChange}
          handleTransactionTableRowClick={handleTransactionTableRowClick}
        />
      )}
      <EditCollectiveSettingsModal
        open={isEditSettingsOpen}
        onOpenChange={setEditSettingsOpen}
        account={account}
        host={host}
      />
    </div>
  );
};
