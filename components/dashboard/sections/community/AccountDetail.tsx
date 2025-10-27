import React from 'react';
import { useQuery } from '@apollo/client';
import { ArrowLeft, BookKey, Dot, Mail } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { integer } from '@/lib/filters/schemas';
import type { AccountReferenceInput } from '@/lib/graphql/types/v2/schema';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';
import { getCountryDisplayName, getFlagEmoji } from '@/lib/i18n/countries';
import { i18nExpenseType } from '@/lib/i18n/expense';
import { cn } from '@/lib/utils';

import { ContributionDrawer } from '@/components/contributions/ContributionDrawer';
import HeroSocialLinks from '@/components/crowdfunding-redesign/SocialLinks';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';
import { InfoTooltipIcon } from '@/components/InfoTooltipIcon';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import OrderStatusTag from '@/components/orders/OrderStatusTag';
import { DataTable } from '@/components/table/DataTable';
import Tabs from '@/components/Tabs';
import { Badge } from '@/components/ui/Badge';

import Avatar from '../../../Avatar';
import { CopyID } from '../../../CopyId';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { Skeleton } from '../../../ui/Skeleton';
import DashboardHeader from '../../DashboardHeader';
import { Pagination } from '../../filters/Pagination';
import { Metric } from '../overview/Metric';
import TimelineItem from '../overview/TimelineItem';

import {
  communityAccountActivitiesQuery,
  communityAccountContributionsDetailQuery,
  communityAccountDetailQuery,
  communityAccountExpensesDetailQuery,
} from './queries';

const expenseSummaryColumns = [
  {
    accessorKey: 'year',
    header: () => <FormattedMessage defaultMessage="Year" id="IFo1oo" />,
    cell: ({ cell }) => {
      return cell.getValue();
    },
  },
  {
    accessorKey: 'expenseCount',
    header: () => <FormattedMessage defaultMessage="Expenses Submitted" id="ExpensesSubmitted" />,
    cell: ({ cell }) => {
      return cell.getValue();
    },
  },
  {
    accessorKey: 'expenseTotal',
    header: () => <FormattedMessage defaultMessage="Total Expended" id="TotalExpended" />,
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return <FormattedMoneyAmount amount={Math.abs(amount.valueInCents)} currency={amount.currency} />;
    },
  },
];

const associatedCollectiveColumns = intl => [
  {
    accessorKey: 'account',
    header: intl.formatMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
    cell: ({ row }) => {
      const { account } = row.original;
      const legalName = account.legalName !== account.name && account.legalName;
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
            {legalName && <span className="ml-1 text-muted-foreground">{`(${legalName})`}</span>}
          </LinkCollective>
        </div>
      );
    },
  },
  {
    accessorKey: 'relations',
    header: intl.formatMessage({ defaultMessage: 'Relations', id: 'mn5pjI' }),
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

const contributionColumns = intl => [
  {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage defaultMessage="Date" id="expense.incurredAt" />,
    cell: ({ cell }) => {
      return <DateTime value={cell.getValue()} />;
    },
  },
  {
    accessorKey: 'toAccount',
    header: () => <FormattedMessage defaultMessage="Collective" id="Collective" />,
    cell: ({ row }) => {
      const order = row.original;
      return (
        <LinkCollective collective={order.toAccount} withHoverCard>
          <Avatar size={24} collective={order.toAccount} mr={2} />
        </LinkCollective>
      );
    },
  },
  {
    accessorKey: 'description',
    header: () => <FormattedMessage defaultMessage="Description" id="Fields.description" />,
    cell: ({ cell }) => {
      const expense = cell.row.original;
      return (
        <div className="flex flex-col">
          <span>{expense.description}</span>
          <span className="text-xs text-muted-foreground">
            {i18nExpenseType(intl, expense.type)}
            {expense.accountingCategory && <span>: {expense.accountingCategory.name}</span>}
            {!expense.accountingCategory && expense.tags?.length > 0 && <span>: {expense.tags.join(', ')}</span>}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: () => <FormattedMessage defaultMessage="Status" id="Status" />,
    cell: ({ cell }) => {
      const status = cell.getValue();
      return <OrderStatusTag status={status} />;
    },
  },
  {
    accessorKey: 'totalContributed',
    header: () => <FormattedMessage id="TotalContributed" defaultMessage="Total Contributed" />,
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return <FormattedMoneyAmount amount={Math.abs(amount.valueInCents)} currency={amount.currency} />;
    },
    meta: { className: 'text-right' },
  },
];

const expenseColumns = intl => [
  {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage defaultMessage="Date" id="expense.incurredAt" />,
    cell: ({ cell }) => {
      return <DateTime value={cell.getValue()} />;
    },
  },
  {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Collective" id="Collective" />,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <LinkCollective collective={expense.account} withHoverCard>
          <Avatar size={24} collective={expense.account} mr={2} />
        </LinkCollective>
      );
    },
  },
  {
    accessorKey: 'description',
    header: () => <FormattedMessage defaultMessage="Description" id="Fields.description" />,
    cell: ({ cell }) => {
      const expense = cell.row.original;
      return (
        <div className="flex flex-col">
          <span>{expense.description}</span>
          <span className="text-xs text-muted-foreground">
            {i18nExpenseType(intl, expense.type)}
            {expense.accountingCategory && <span>: {expense.accountingCategory.name}</span>}
            {!expense.accountingCategory && expense.tags?.length > 0 && <span>: {expense.tags.join(', ')}</span>}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: () => <FormattedMessage defaultMessage="Status" id="Status" />,
    cell: ({ cell }) => {
      const status = cell.getValue();
      return <ExpenseStatusTag status={status} />;
    },
  },
  {
    accessorKey: 'amount',
    header: () => <FormattedMessage id="TotalAmount" defaultMessage="Total amount" />,
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return <FormattedMoneyAmount amount={Math.abs(amount.valueInCents)} currency={amount.currency} />;
    },
    meta: { className: 'text-right' },
  },
];

const contributionSummaryColumns = [
  {
    accessorKey: 'year',
    header: () => <FormattedMessage defaultMessage="Year" id="IFo1oo" />,
    cell: ({ cell }) => {
      return cell.getValue();
    },
  },
  {
    accessorKey: 'contributionCount',
    header: () => <FormattedMessage defaultMessage="Charged Processed" id="ChargesProcessed" />,
    cell: ({ cell }) => {
      return cell.getValue();
    },
  },
  {
    accessorKey: 'contributionTotal',
    header: () => <FormattedMessage defaultMessage="Total Contributed" id="TotalContributed" />,
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return <FormattedMoneyAmount amount={Math.abs(amount.valueInCents)} currency={amount.currency} />;
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
}

type ContributionDrawerProps = {
  onClose: () => void;
  account?: AccountReferenceInput;
  host?: AccountReferenceInput;
};

export function ContributorDetails(props: ContributionDrawerProps) {
  const intl = useIntl();
  const [selectedTab, setSelectedTab] = React.useState<AccountDetailView>(AccountDetailView.DETAILS);
  const [openExpenseId, setOpenExpenseId] = React.useState(null);
  const [openContributionId, setOpenContributionId] = React.useState(null);

  const query = useQuery(communityAccountDetailQuery, {
    context: API_V2_CONTEXT,
    variables: {
      accountId: props.account.id,
      host: props.host,
      hostSlug: props.host.slug,
    },
  });

  const pagination = useQueryFilter({
    schema: z.object({ limit: integer.default(5), offset: integer.default(0) }),
    filters: {},
    skipRouter: true,
  });
  const activityPagination = useQueryFilter({
    schema: z.object({ limit: integer.default(10), offset: integer.default(0) }),
    filters: {},
    skipRouter: true,
  });
  const { data: expensesData } = useQuery(communityAccountExpensesDetailQuery, {
    context: API_V2_CONTEXT,
    variables: {
      accountId: props.account.id,
      host: props.host,
      ...pagination.variables,
    },
  });

  const { data: contributionsData } = useQuery(communityAccountContributionsDetailQuery, {
    context: API_V2_CONTEXT,
    variables: {
      accountId: props.account.id,
      host: props.host,
      ...pagination.variables,
    },
  });
  const { data: activitiesData } = useQuery(communityAccountActivitiesQuery, {
    context: API_V2_CONTEXT,
    variables: {
      accountId: props.account.id,
      host: props.host,
      ...activityPagination.variables,
    },
  });

  const handleTabChange = React.useCallback(
    (tab: AccountDetailView) => {
      pagination.setFilter('offset', null);
      activityPagination.setFilter('offset', null);
      setSelectedTab(tab);
    },
    [pagination, activityPagination, setSelectedTab],
  );

  const isLoading = !query.called || query.loading || !query.data;
  const account = query.data?.account;

  const relations =
    account?.communityStats?.relations?.filter(
      (relation, _, relations) => !(relation === 'EXPENSE_SUBMITTER' && relations.includes('PAYEE')),
    ) || [];
  const totalExpended = account?.communityStats?.transactionSummary?.reduce(
    (acc, curr) => ({
      valueInCents: acc.valueInCents + (curr.expenseTotal.valueInCents || 0),
      currency: curr.expenseTotal.currency,
    }),
    { valueInCents: 0, currency: 'USD' },
  ) || { valueInCents: 0, currency: 'USD' };
  const expenseCount =
    account?.communityStats?.transactionSummary?.reduce((acc, curr) => acc + (curr.expenseCount || 0), 0) || 0;
  const totalContributed = account?.communityStats?.transactionSummary?.reduce(
    (acc, curr) => ({
      valueInCents: acc.valueInCents + (curr.contributionTotal.valueInCents || 0),
      currency: curr.contributionTotal.currency,
    }),
    { valueInCents: 0, currency: 'USD' },
  ) || { valueInCents: 0, currency: 'USD' };
  const chargeCount =
    account?.communityStats?.transactionSummary?.reduce((acc, curr) => acc + (curr.contributionCount || 0), 0) || 0;
  const contributionCount = contributionsData?.account?.orders.totalCount || 0;
  const activities = activitiesData?.account?.communityStats?.activities.nodes || [];
  const activitiesCount = activitiesData?.account?.communityStats?.activities.totalCount || 0;

  const tabs = React.useMemo(
    () => [
      {
        id: AccountDetailView.DETAILS,
        label: <FormattedMessage defaultMessage="Details" id="Details" />,
      },
      {
        id: AccountDetailView.EXPENSES,
        label: <FormattedMessage defaultMessage="Expenses" id="Expenses" />,
        count: expenseCount,
      },
      {
        id: AccountDetailView.CONTRIBUTIONS,
        label: <FormattedMessage defaultMessage="Contributions" id="Contributions" />,
        count: contributionCount,
      },
      {
        id: AccountDetailView.ACTIVITIES,
        label: <FormattedMessage defaultMessage="Activities" id="Activities" />,
        count: activitiesCount,
      },
    ],
    [expenseCount, contributionCount, activitiesCount],
  );

  return (
    <div className="flex max-w-screen-lg flex-col">
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
            {account.email && (
              <React.Fragment>
                <Dot size={14} />
                <div className="flex items-center gap-1">
                  <Mail size={14} />
                  <CopyID
                    value={account.email}
                    tooltipLabel={<FormattedMessage defaultMessage="Copy Email" id="8NlxGY" />}
                    className="inline-flex items-center gap-1"
                    Icon={null}
                  >
                    {account.email}
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
      <div className="mt-4 flex flex-col gap-4">
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
              />
            </div>
            <div
              className="flex flex-col gap-4 aria-hidden:hidden"
              aria-hidden={selectedTab !== AccountDetailView.ACTIVITIES}
            >
              <h1 className="flex items-center font-medium">
                <FormattedMessage defaultMessage="Recent activities" id="RecentActivities" />
                <InfoTooltipIcon className="ml-2">
                  <FormattedMessage
                    defaultMessage="The activities listed here are contextual to your fiscal-host and do not necessarily represent all activities performed by this user on the platform."
                    id="mTzyCH"
                  />
                </InfoTooltipIcon>
              </h1>
              <div className="group flex flex-col gap-1 space-y-3 divide-y rounded-xl border p-4">
                {activities.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="No recent activities" id="NoRecentActivities" />
                  </div>
                ) : (
                  activities.map(activity => (
                  <TimelineItem key={activity.id} activity={activity} openExpense={id => setOpenExpenseId(id)} />
                  ))
                )}
              </div>
              <Pagination
                queryFilter={activityPagination}
                total={activitiesData?.account?.communityStats?.activities.totalCount}
              />
            </div>
            <div
              className="flex flex-col gap-4 aria-hidden:hidden"
              aria-hidden={selectedTab !== AccountDetailView.EXPENSES}
            >
              <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Metric
                  label={<FormattedMessage defaultMessage="Total Received" id="TotalReceived" />}
                  amount={{ current: totalExpended }}
                />
                <Metric
                  label={
                    <FormattedMessage defaultMessage="Number of Submitted Paid Expenses" id="NumberPaidExpenses" />
                  }
                  count={{ current: expenseCount }}
                />
              </div>
              <DataTable
                columns={expenseSummaryColumns}
                data={account?.communityStats?.transactionSummary.filter(curr => curr.expenseCount > 0) || []}
              />
              <h1 className="font-medium">
                <FormattedMessage defaultMessage="Expenses" id="Expenses" />
              </h1>
              <DataTable
                data={expensesData?.account?.expenses.nodes || []}
                columns={expenseColumns(intl)}
                onClickRow={row => setOpenExpenseId(row.original.legacyId)}
              />
              <Pagination queryFilter={pagination} total={expensesData?.account?.expenses.totalCount} />
            </div>
            <div
              className="flex flex-col gap-4 aria-hidden:hidden"
              aria-hidden={selectedTab !== AccountDetailView.CONTRIBUTIONS}
            >
              <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Metric
                  label={<FormattedMessage defaultMessage="Total Contributed" id="TotalContributed" />}
                  amount={{ current: totalContributed }}
                />
                <Metric
                  label={<FormattedMessage defaultMessage="Number of Contributions" id="NumberContributions" />}
                  count={{ current: contributionCount }}
                />
                <Metric
                  label={<FormattedMessage defaultMessage="Number of Processed Charges" id="NumberProcessedCharges" />}
                  count={{ current: chargeCount }}
                />
              </div>
              <DataTable
                columns={contributionSummaryColumns}
                data={account?.communityStats?.transactionSummary?.filter(curr => curr.contributionCount > 0) || []}
              />
              <h1 className="font-medium">
                <FormattedMessage defaultMessage="Contributions" id="Contributions" />
              </h1>
              <DataTable
                data={contributionsData?.account?.orders.nodes || []}
                columns={contributionColumns(intl)}
                onClickRow={row => setOpenContributionId(row.original.legacyId)}
              />
              <Pagination queryFilter={pagination} total={contributionsData?.account?.orders.totalCount} />
            </div>
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
