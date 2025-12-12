import React from 'react';
import { useQuery } from '@apollo/client';
import { pick } from 'lodash';
import { ArrowLeft, BookKey, Dot, Mail } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import { CollectiveType } from '@/lib/constants/collectives';
import type { CommunityAccountDetailQuery } from '@/lib/graphql/types/v2/graphql';
import { CommunityRelationType } from '@/lib/graphql/types/v2/graphql';
import { type AccountReferenceInput, KycProvider } from '@/lib/graphql/types/v2/schema';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';
import { getCountryDisplayName, getFlagEmoji } from '@/lib/i18n/countries';
import { cn } from '@/lib/utils';

import { ContributionDrawer } from '@/components/contributions/ContributionDrawer';
import HeroSocialLinks from '@/components/crowdfunding-redesign/SocialLinks';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import { KYCTabPeopleDashboard } from '@/components/kyc/dashboard/KYCTabPeopleDashboard';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import { DataTable } from '@/components/table/DataTable';
import Tabs from '@/components/Tabs';
import { Badge } from '@/components/ui/Badge';

import Avatar from '../../../Avatar';
import { CopyID } from '../../../CopyId';
import DateTime from '../../../DateTime';
import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { Skeleton } from '../../../ui/Skeleton';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';

import { ActivitiesTab } from './AccountDetailActivitiesTab';
import { ContributionsTab } from './AccountDetailContributionsTab';
import { ExpensesTab } from './AccountDetailExpensesTab';
import { communityAccountDetailQuery } from './queries';

const associatedCollectiveColumns = intl => [
  {
    accessorKey: 'account',
    header: intl.formatMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
    cell: ({ row }) => {
      const { account } = row.original;
      return (
        <div className="flex items-center text-nowrap">
          {account.isFrozen && (
            <Badge type="info" size="xs" className="mr-2">
              <FormattedMessage id="CollectiveStatus.Frozen" defaultMessage="Frozen" />
            </Badge>
          )}
          <LinkCollective collective={account} className="flex items-center gap-1" withHoverCard>
            <Avatar size={24} collective={account} mr={2} />
            {account.name}
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
];

const SummaryCard = ({
  title,
  isLoading,
  children,
  className,
}: {
  title: string | React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('group flex flex-col gap-1 rounded-xl border transition-all', className)}>
      <div className="w-full space-y-1 p-3">
        <div className="flex items-center gap-1">
          <span className="block text-sm font-medium tracking-tight">{title}</span>
        </div>
        <div>{isLoading ? <Skeleton className="h-6 w-48" /> : children}</div>
      </div>
    </div>
  );
};

enum AccountDetailView {
  DETAILS = 'DETAILS',
  EXPENSES = 'EXPENSES',
  CONTRIBUTIONS = 'CONTRIBUTIONS',
  ACTIVITIES = 'ACTIVITIES',
  KYC = 'KYC',
}

type ContributionDrawerProps = {
  onClose: () => void;
  account?: AccountReferenceInput;
  host?: AccountReferenceInput;
};

export function ContributorDetails(props: ContributionDrawerProps) {
  const { account: dashboardAccount } = React.useContext(DashboardContext);
  const intl = useIntl();
  const [selectedTab, setSelectedTab] = React.useState<AccountDetailView>(AccountDetailView.DETAILS);
  const [openExpenseId, setOpenExpenseId] = React.useState(null);
  const [openContributionId, setOpenContributionId] = React.useState(null);

  const { LoggedInUser } = useLoggedInUser();

  const query = useQuery<CommunityAccountDetailQuery>(communityAccountDetailQuery, {
    variables: {
      accountId: props.account.id,
      host: props.host,
    },
    // Since tabs data is loaded on demand, we don't want to refetch when switching tabs
    nextFetchPolicy: 'standby',
  });

  const kycStatus = query.data?.account && 'kycStatus' in query.data.account ? query.data.account['kycStatus'] : {};
  const tabs = React.useMemo(
    () => [
      {
        id: AccountDetailView.DETAILS,
        label: <FormattedMessage defaultMessage="Details" id="Details" />,
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
  const relations =
    account?.communityStats?.relations?.filter(
      (relation, _, relations) =>
        !(relation === CommunityRelationType.EXPENSE_SUBMITTER && relations.includes(CommunityRelationType.PAYEE)),
    ) || [];
  const legalName = account?.legalName !== account?.name && account?.legalName;

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
                {account.name}
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
      <div className="mt-4 flex flex-grow flex-col gap-4">
        {query.error ? (
          <MessageBoxGraphqlError error={query.error} />
        ) : (
          <React.Fragment>
            <Tabs tabs={tabs} selectedId={selectedTab as string} onChange={handleTabChange} />
            <div
              className="flex flex-col gap-4 aria-hidden:hidden"
              aria-hidden={selectedTab !== AccountDetailView.DETAILS}
            >
              <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(account?.location?.address || account?.location?.country) && (
                  <SummaryCard
                    title={<FormattedMessage defaultMessage="Location" id="SectionLocation.Title" />}
                    isLoading={isLoading}
                    className={account.location.address && 'col-span-2'}
                  >
                    <LocationAddress location={account.location} />
                  </SummaryCard>
                )}
                <SummaryCard
                  title={<FormattedMessage defaultMessage="On the Platform Since" id="OnThePlatformSince" />}
                  isLoading={isLoading}
                >
                  {account?.createdAt && <DateTime value={account.createdAt} dateStyle="long" />}
                </SummaryCard>
                <SummaryCard
                  title={<FormattedMessage defaultMessage="Interactions with Host" id="InteractionsWithHost" />}
                  isLoading={isLoading}
                  className="text-sm"
                >
                  {account?.communityStats?.firstInteractionAt && (
                    <div>
                      <FormattedMessage defaultMessage="First" id="First" />:{' '}
                      <DateTime value={account?.communityStats?.firstInteractionAt} dateStyle="long" />
                    </div>
                  )}
                  {account?.communityStats?.lastInteractionAt && (
                    <div>
                      <FormattedMessage defaultMessage="Last" id="Last" />:{' '}
                      <DateTime value={account?.communityStats?.lastInteractionAt} dateStyle="long" />
                    </div>
                  )}
                </SummaryCard>
              </div>
              <h1 className="font-medium">
                <FormattedMessage defaultMessage="Associated Collectives" id="AssociatedCollectives" />
              </h1>
              <DataTable
                data={account?.communityStats?.associatedCollectives || []}
                columns={associatedCollectiveColumns(intl)}
                loading={isLoading}
              />
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
