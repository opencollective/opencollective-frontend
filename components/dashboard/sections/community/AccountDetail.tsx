import React from 'react';
import { useQuery } from '@apollo/client';
import { capitalize, compact, pick } from 'lodash';
import { ArrowLeft, BookKey, Dot, HelpCircle, Mail } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import { CollectiveType } from '@/lib/constants/collectives';
import type { CommunityAccountDetailQuery } from '@/lib/graphql/types/v2/graphql';
import { CommunityRelationType } from '@/lib/graphql/types/v2/graphql';
import type { Account, AccountReferenceInput } from '@/lib/graphql/types/v2/schema';
import { KycProvider } from '@/lib/graphql/types/v2/schema';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { ActivityDescriptionI18n } from '@/lib/i18n/activities';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';
import { getCountryDisplayName, getFlagEmoji } from '@/lib/i18n/countries';
import { getDashboardRoute } from '@/lib/url-helpers';

import { ContributionDrawer } from '@/components/contributions/ContributionDrawer';
import HeroSocialLinks from '@/components/crowdfunding-redesign/SocialLinks';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { KYCTabPeopleDashboard } from '@/components/kyc/dashboard/KYCTabPeopleDashboard';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import { actionsColumn, DataTable } from '@/components/table/DataTable';
import Tabs from '@/components/Tabs';
import { Badge } from '@/components/ui/Badge';
import { InfoList, InfoListItem } from '@/components/ui/InfoList';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

import Avatar from '../../../Avatar';
import { CopyID } from '../../../CopyId';
import DateTime from '../../../DateTime';
import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { Skeleton } from '../../../ui/Skeleton';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { getActivityVariables } from '../ActivityLog/ActivityDescription';

import { ActivitiesTab } from './AccountDetailActivitiesTab';
import { ContributionsTab } from './AccountDetailContributionsTab';
import { ExpensesTab } from './AccountDetailExpensesTab';
import { AccountTaxFormStatus } from './AccountTaxFormStatus';
import { useAssociatedCollectiveActions } from './common';
import { communityAccountDetailQuery } from './queries';

type ActivityType = NonNullable<CommunityAccountDetailQuery['firstActivity']['nodes'][0]>;

const RichActivityDate = ({ date, activity }: { date: string | null | undefined; activity?: ActivityType | null }) => {
  const intl = useIntl();
  if (!date) {
    return null;
  } else if (!activity) {
    return <DateTime value={date} dateStyle="long" />;
  }

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <div className="inline-flex cursor-help items-center gap-1.5">
          <span className="border-b border-dashed border-muted-foreground/40">
            <DateTime value={date} dateStyle="long" />
          </span>
          <HelpCircle size={14} className="shrink-0 text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="z-[9999] max-w-xs text-left">
        {ActivityDescriptionI18n[activity.type]
          ? intl.formatMessage(ActivityDescriptionI18n[activity.type], getActivityVariables(intl, activity))
          : capitalize(activity.type.replace(/_/g, ' '))}
      </TooltipContent>
    </Tooltip>
  );
};

const associatedTableColumns = (intl, includeAssociatedCollectiveColumns = false) =>
  compact([
    {
      accessorKey: 'account',
      meta: {
        className: 'max-w-48',
      },
      header: intl.formatMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
      cell: ({ row }) => {
        const { account } = row.original;
        return (
          <div className="flex min-w-0 items-center overflow-hidden">
            {account.isFrozen && (
              <Badge type="info" size="xs" className="mr-2 shrink-0">
                <FormattedMessage id="CollectiveStatus.Frozen" defaultMessage="Frozen" />
              </Badge>
            )}
            <LinkCollective
              collective={account}
              className="flex min-w-0 items-center gap-1 overflow-hidden"
              withHoverCard
            >
              <Avatar size={24} collective={account} mr={2} />
              <span className="truncate">{account.name}</span>
            </LinkCollective>
          </div>
        );
      },
    },
    {
      accessorKey: 'relations',
      header: intl.formatMessage({ defaultMessage: 'Roles', id: 'c35gM5' }),
      cell: ({ row }) => {
        const relations =
          row.original.relations?.filter(
            (relation, _, relations) => !(relation === 'EXPENSE_SUBMITTER' && relations.includes('PAYEE')),
          ) || [];
        return (
          <div className="flex gap-1 align-middle">
            {relations.map(role => (
              <div
                key={role}
                className="inline-flex items-center gap-0.5 rounded-md bg-transparent px-2 py-1 align-middle text-xs font-medium text-nowrap text-muted-foreground ring-1 ring-slate-300 ring-inset"
              >
                {formatCommunityRelation(intl, role)}
              </div>
            ))}
          </div>
        );
      },
    },
    includeAssociatedCollectiveColumns && {
      accessorKey: 'expenses',
      header: intl.formatMessage({ defaultMessage: 'Total Expenses', id: 'TotalExpenses' }),
      cell: ({ row }) => {
        const summary = row.original.transactionSummary;
        const total = summary?.expenseTotal;
        const count = summary?.expenseCount || 0;

        if (!total || count === 0) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <div className="text-sm">
            <FormattedMoneyAmount
              amount={Math.abs(total.valueInCents)}
              currency={total.currency}
              showCurrencyCode={false}
            />
            <span className="ml-1 text-muted-foreground">({count})</span>
          </div>
        );
      },
    },

    includeAssociatedCollectiveColumns && {
      accessorKey: 'contributions',
      header: intl.formatMessage({ defaultMessage: 'Total Contributions', id: 'TotalContributions' }),
      cell: ({ row }) => {
        const summary = row.original.transactionSummary;
        const total = summary?.contributionTotal;
        const count = summary?.contributionCount || 0;

        if (!total || count === 0) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <div className="text-sm">
            <FormattedMoneyAmount
              amount={Math.abs(total.valueInCents)}
              currency={total.currency}
              showCurrencyCode={false}
            />
            <span className="ml-1 text-muted-foreground">({count})</span>
          </div>
        );
      },
    },
    includeAssociatedCollectiveColumns && {
      accessorKey: 'firstInteraction',
      header: intl.formatMessage({ defaultMessage: 'First Interaction', id: 'FirstInteraction' }),
      cell: ({ row }) => {
        const date = row.original.firstInteractionAt;
        return date ? <DateTime value={date} dateStyle="medium" /> : <span className="text-muted-foreground">—</span>;
      },
    },
    includeAssociatedCollectiveColumns && actionsColumn,
  ]);

enum AccountDetailView {
  OVERVIEW = 'OVERVIEW',
  EXPENSES = 'EXPENSES',
  CONTRIBUTIONS = 'CONTRIBUTIONS',
  ACTIVITIES = 'ACTIVITIES',
  KYC = 'KYC',
}

type ContributionDrawerProps = {
  onClose: () => void;
  account?: AccountReferenceInput;
  host?: Pick<Account, 'id' | 'currency' | 'slug'>;
};

export function ContributorDetails(props: ContributionDrawerProps) {
  const { account: dashboardAccount } = React.useContext(DashboardContext);
  const intl = useIntl();
  const [selectedTab, setSelectedTab] = React.useState<AccountDetailView>(AccountDetailView.OVERVIEW);
  const [openExpenseId, setOpenExpenseId] = React.useState(null);
  const [openContributionId, setOpenContributionId] = React.useState(null);

  const { LoggedInUser } = useLoggedInUser();

  const query = useQuery<CommunityAccountDetailQuery>(communityAccountDetailQuery, {
    variables: {
      accountId: props.account.id,
      hostSlug: props.host.slug,
    },
    // Since tabs data is loaded on demand, we don't want to refetch when switching tabs
    nextFetchPolicy: 'standby',
  });

  const kycStatus = query.data?.account && 'kycStatus' in query.data.account ? query.data.account['kycStatus'] : {};
  const tabs = React.useMemo(
    () => [
      {
        id: AccountDetailView.OVERVIEW,
        label: <FormattedMessage defaultMessage="Overview" id="AdminPanel.Menu.Overview" />,
      },
      {
        id: AccountDetailView.EXPENSES,
        label: <FormattedMessage defaultMessage="Expenses" id="Expenses" />,
        count: query.data?.account?.communityStats?.transactionSummary[0]?.expenseCountAcc || 0,
      },
      {
        id: AccountDetailView.CONTRIBUTIONS,
        label: <FormattedMessage defaultMessage="Contributions" id="Contributions" />,
        count: query.data?.account?.communityStats?.transactionSummary[0]?.contributionCountAcc || 0,
      },
      {
        id: AccountDetailView.ACTIVITIES,
        label: <FormattedMessage defaultMessage="Activities" id="Activities" />,
      },
      ...(query.data?.account?.type === CollectiveType.INDIVIDUAL && isFeatureEnabled(dashboardAccount, FEATURES.KYC)
        ? [
            {
              id: AccountDetailView.KYC,
              label: 'KYC',
              count: Object.values(pick(kycStatus, [KycProvider.MANUAL.toLowerCase()])).filter(
                status => status !== null,
              ).length,
            },
          ]
        : []),
    ],
    [query.data, query.data?.account?.type, LoggedInUser, kycStatus],
  );

  const handleTabChange = React.useCallback(
    (tab: AccountDetailView) => {
      setSelectedTab(tab);
    },
    [setSelectedTab],
  );

  const isLoading = query.loading || !query.data;
  const account = query.data?.account;
  const getActions = useAssociatedCollectiveActions({ accountSlug: account?.slug });
  const relations =
    account?.communityStats?.relations?.filter(
      (relation, _, relations) =>
        !(relation === CommunityRelationType.EXPENSE_SUBMITTER && relations.includes(CommunityRelationType.PAYEE)),
    ) || [];
  const legalName = account?.legalName !== account?.name && account?.legalName;
  const taxForms = query.data?.host?.hostedLegalDocuments;

  return (
    <div className="flex h-full flex-col">
      <button className="mb-4 flex w-fit items-center text-xs text-gray-500" onClick={() => history.back()}>
        <ArrowLeft size="14px" className="mr-1" />
        <FormattedMessage defaultMessage="Go Back" id="GoBack" />
      </button>
      <DashboardHeader
        title={
          <div className="flex items-center gap-2">
            {isLoading ? (
              <React.Fragment>
                <Skeleton className="aspect-square size-9" />
                <Skeleton className="h-6 w-48" />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Avatar collective={account} size={36} />
                {account.name || account.slug}
                {legalName && <span className="font-semibold text-muted-foreground">{`(${legalName})`}</span>}
                <div className="flex flex-wrap gap-1 align-middle">
                  {relations.map(role => (
                    <div
                      key={role}
                      className="inline-flex items-center gap-0.5 rounded-md bg-transparent px-2 py-1 align-middle text-xs font-medium text-nowrap text-muted-foreground ring-1 ring-slate-300 ring-inset"
                    >
                      {formatCommunityRelation(intl, role)}
                    </div>
                  ))}
                </div>
              </React.Fragment>
            )}
          </div>
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${account?.slug}`}>
              <FormattedMessage defaultMessage="View Profile" id="viewProfile" />
            </Link>
          </Button>
        }
      />
      <div className="mt-2 flex justify-between">
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookKey size={14} />
              <CopyID
                value={props.account.id}
                tooltipLabel={<FormattedMessage defaultMessage="Copy Account ID" id="D+P5Yx" />}
                className="inline-flex items-center gap-1"
                Icon={null}
              >
                {props.account.id.split('-')[0]}...
              </CopyID>
            </div>
            {account['email'] && (
              <React.Fragment>
                <Dot size={14} />
                <div className="flex items-center gap-1">
                  <Mail size={14} />
                  <CopyID
                    value={account['email']}
                    tooltipLabel={<FormattedMessage defaultMessage="Copy Email" id="8NlxGY" />}
                    className="inline-flex items-center gap-1"
                    Icon={null}
                  >
                    {account['email']}
                  </CopyID>
                </div>
              </React.Fragment>
            )}
            {account.location?.country && (
              <React.Fragment>
                <Dot size={14} />
                <div className="flex items-center gap-1">
                  <span>{getFlagEmoji(account.location.country)}</span>
                  <span>{getCountryDisplayName(intl, account.location.country)}</span>
                </div>
              </React.Fragment>
            )}
            {account.socialLinks?.length > 0 && (
              <React.Fragment>
                <Dot size={14} />
                <HeroSocialLinks className="size-6" socialLinks={account.socialLinks} />
              </React.Fragment>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-grow flex-col gap-8">
        {query.error ? (
          <MessageBoxGraphqlError error={query.error} />
        ) : (
          <React.Fragment>
            <Tabs tabs={tabs} selectedId={selectedTab as string} onChange={handleTabChange} />
            <div
              className="grid grid-cols-1 gap-12 aria-hidden:hidden xl:grid-cols-4"
              aria-hidden={selectedTab !== AccountDetailView.OVERVIEW}
            >
              <div className="space-y-4 xl:order-2">
                <h2 className="tight text-xl font-bold text-slate-800">
                  <FormattedMessage defaultMessage="Details" id="Details" />
                </h2>
                <InfoList variant="compact" className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
                  <InfoListItem
                    title={<FormattedMessage defaultMessage="Legal name" id="OozR1Y" />}
                    value={account?.legalName}
                    isLoading={isLoading}
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
                  <InfoListItem
                    title={<FormattedMessage defaultMessage="Joined the platform on" id="Vf1x2A" />}
                    value={account?.createdAt && <DateTime value={account.createdAt} dateStyle="long" />}
                    isLoading={isLoading}
                  />
                  <InfoListItem
                    title={<FormattedMessage defaultMessage="First interaction with Host" id="mJq3cC" />}
                    value={
                      <RichActivityDate
                        date={account?.communityStats?.firstInteractionAt}
                        activity={query.data?.firstActivity?.nodes?.[0]}
                      />
                    }
                    isLoading={isLoading}
                  />
                  <InfoListItem
                    title={<FormattedMessage defaultMessage="Last interaction with Host" id="0k5yUb" />}
                    value={
                      <RichActivityDate
                        date={account?.communityStats?.lastInteractionAt}
                        activity={query.data?.lastActivity?.nodes?.[0]}
                      />
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
                              href={getDashboardRoute(props.host, `host-tax-forms?account=${account?.slug}`)}
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
              </div>

              <div className="space-y-4 xl:order-1 xl:col-span-3">
                <h2 className="text-xl font-bold text-slate-800">
                  <FormattedMessage defaultMessage="Associated Collectives" id="AssociatedCollectives" />
                </h2>
                <DataTable
                  data={account?.communityStats?.associatedCollectives || []}
                  columns={associatedTableColumns(intl, true)}
                  loading={isLoading}
                  getActions={getActions}
                />
                <h2 className="mt-12 text-xl font-bold text-slate-800">
                  <FormattedMessage defaultMessage="Associated Organizations" id="E9PjGp" />
                </h2>
                <DataTable
                  data={account?.communityStats?.associatedOrganizations || []}
                  columns={associatedTableColumns(intl)}
                  loading={isLoading}
                />
              </div>
            </div>
            {selectedTab === AccountDetailView.CONTRIBUTIONS && (
              <ContributionsTab account={account} host={props.host} setOpenContributionId={setOpenContributionId} />
            )}
            {selectedTab === AccountDetailView.EXPENSES && (
              <ExpensesTab account={account} host={props.host} setOpenExpenseId={setOpenExpenseId} />
            )}
            {selectedTab === AccountDetailView.ACTIVITIES && (
              <ActivitiesTab account={account} host={props.host} setOpenExpenseId={setOpenExpenseId} />
            )}
            {selectedTab === AccountDetailView.KYC && (
              <KYCTabPeopleDashboard requestedByAccount={props.host} verifyAccount={props.account} />
            )}
          </React.Fragment>
        )}
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
