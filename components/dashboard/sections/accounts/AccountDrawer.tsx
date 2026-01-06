import React from 'react';
import { useQuery } from '@apollo/client';
import { clsx } from 'clsx';
import { AlertTriangle, ArrowLeft, ArrowRight, Undo } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import type { DashboardAccountsQueryFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { i18nTransactionKind } from '../../../../lib/i18n/transaction';
import { getDashboardRoute } from '../../../../lib/url-helpers';
import type { GetActions } from '@/lib/actions/types';
import { usePrevious } from '@/lib/hooks/usePrevious';
import formatAccountType from '@/lib/i18n/account-type';

import { CopyID } from '@/components/CopyId';
import DrawerHeader from '@/components/DrawerHeader';
import { Sheet, SheetBody, SheetContent } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { InfoList, InfoListItem } from '../../../ui/InfoList';
import ActivityDescription from '../ActivityLog/ActivityDescription';
import { ActivityUser } from '../ActivityLog/ActivityUser';

import { accountDetailQuery } from './queries';

type AccountDetailsProps = {
  accountId?: string;
  getActions: GetActions<DashboardAccountsQueryFieldsFragment>;
};

const transactionsTableColumns = [
  {
    accessorKey: 'clearedAt',
    header: () => <FormattedMessage defaultMessage="Effective Date" id="Gh3Obs" />,
    cell: ({ cell, row }) => {
      const clearedAt = cell.getValue();
      if (!clearedAt) {
        return (
          <div className="whitespace-nowrap text-green-500">
            <DateTime dateStyle="medium" timeStyle="short" value={row.original.createdAt} />
          </div>
        );
      }
      return (
        <div className="whitespace-nowrap">
          <DateTime dateStyle="medium" timeStyle="short" value={clearedAt} />
        </div>
      );
    },
  },
  {
    accessorKey: 'oppositeAccount',
    header: () => <FormattedMessage defaultMessage="Recipient/Sender" id="YT2bNN" />,
    cell: ({ cell, row }) => {
      const account = cell.getValue();
      const transaction = row.original;
      return (
        <AccountHoverCard
          account={account}
          trigger={
            <div className="flex items-center gap-1 truncate">
              {transaction.type === 'CREDIT' ? (
                <ArrowLeft className="inline-block shrink-0 text-green-600" size={16} />
              ) : (
                <ArrowRight className="inline-block shrink-0" size={16} />
              )}
              <Avatar collective={account} radius={20} />
              <span className="truncate">{account?.name}</span>
            </div>
          }
        />
      );
    },
  },
  {
    accessorKey: 'kind',
    header: () => <FormattedMessage defaultMessage="Kind" id="Transaction.Kind" />,
    cell: ({ cell, table, row }) => {
      const { intl } = table.options.meta;
      const kind = cell.getValue();
      const kindLabel = i18nTransactionKind(intl, kind);
      const isExpense = kind === 'EXPENSE';
      const { isRefund, isRefunded, isInReview, isDisputed, expense, isOrderRejected } = row.original;

      return (
        <div className="flex justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate">{kindLabel}</span>
            {isExpense && expense?.type && <Badge size="xs">{i18nExpenseType(intl, expense.type)}</Badge>}
          </div>
          <div>
            {isRefunded && !isOrderRejected && (
              <Badge size="xs" type={'warning'} className="items-center gap-1">
                <Undo size={12} />
                <FormattedMessage defaultMessage="Refunded" id="Gs86nL" />
              </Badge>
            )}
            {isRefund && (
              <Badge size="xs" type={'success'} className="items-center gap-1">
                <FormattedMessage id="Refund" defaultMessage="Refund" />
              </Badge>
            )}
            {isDisputed && (
              <Badge size="xs" type={'error'} className="items-center gap-1">
                <AlertTriangle size={12} />
                <FormattedMessage defaultMessage="Disputed" id="X1pwhF" />
              </Badge>
            )}
            {isOrderRejected && isRefunded && (
              <Badge size="xs" type={'error'} className="items-center gap-1">
                <AlertTriangle size={12} />
                <FormattedMessage defaultMessage="Rejected" id="5qaD7s" />
              </Badge>
            )}
            {isInReview && (
              <Badge size="xs" type={'warning'} className="items-center gap-1">
                <AlertTriangle size={12} />
                <FormattedMessage id="order.in_review" defaultMessage="In Review" />
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'netAmount',
    header: () => <FormattedMessage defaultMessage="Amount" id="Fields.amount" />,
    cell: ({ cell, row }) => {
      const netAmount = cell.getValue();
      const transaction = row.original;

      return (
        <div
          className={clsx(
            'truncate font-semibold antialiased',
            transaction.type === 'CREDIT' ? 'text-green-600' : 'text-slate-700',
          )}
        >
          <FormattedMoneyAmount
            amount={netAmount.valueInCents}
            currency={netAmount.currency}
            precision={2}
            showCurrencyCode={false}
          />
        </div>
      );
    },
  },
];

const activitiesTableColumns = [
  {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
    cell: ({ cell }) => {
      return <DateTime value={cell.getValue()} dateStyle="medium" timeStyle="short" />;
    },
  },
  {
    accessorKey: 'individual',
    header: () => <FormattedMessage id="Tags.USER" defaultMessage="User" />,
    cell: ({ row }) => {
      const activity = row.original;
      return <ActivityUser activity={activity} />;
    },
  },
  {
    accessorKey: 'description',
    header: () => <FormattedMessage id="Fields.description" defaultMessage="Description" />,
    cell: ({ row }) => {
      const activity = row.original;
      return <ActivityDescription activity={activity} />;
    },
  },
];

const AccountDetails = ({ accountId, getActions }: AccountDetailsProps) => {
  const intl = useIntl();
  const router = useRouter();
  const prevAccountId = usePrevious(accountId);
  const id = accountId || prevAccountId; // To keep data while closing the drawer
  const { data, loading, refetch } = useQuery(accountDetailQuery, {
    variables: { id },
  });

  const dropdownTriggerRef = React.useRef(undefined);
  const account = data?.account;

  const actions = getActions(account, dropdownTriggerRef, refetch);

  const activities = data?.activities?.nodes;
  const isLoading = loading;
  const isChild = !!account?.parent?.id;

  const balance = account?.stats?.balance;
  const consolidatedBalance = account?.stats?.consolidatedBalance;
  const displayBalance =
    !isChild && balance?.valueInCents !== consolidatedBalance?.valueInCents ? (
      <React.Fragment>
        <FormattedMoneyAmount amount={balance?.valueInCents} currency={balance?.currency} />
        <span className="ml-2">
          (<FormattedMoneyAmount amount={consolidatedBalance?.valueInCents} currency={consolidatedBalance?.currency} />{' '}
          <FormattedMessage defaultMessage="total" id="total" />)
        </span>
      </React.Fragment>
    ) : (
      <FormattedMoneyAmount amount={balance?.valueInCents} currency={balance?.currency} />
    );

  return (
    <React.Fragment>
      <DrawerHeader
        actions={actions}
        dropdownTriggerRef={dropdownTriggerRef}
        entityName={<FormattedMessage defaultMessage="Account" id="TwyMau" />}
        entityIdentifier={<CopyID value={id}>{id}</CopyID>}
        separateRowForEntityLabel
        entityLabel={
          <div className="w-full">
            {isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <div className="flex w-full items-center gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar collective={account} className="" radius={32} />
                  <p className="truncate text-xl font-semibold text-foreground">{account.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge size="sm" type="outline">
                    {formatAccountType(intl, account.type)}
                  </Badge>
                  {account.isFrozen && (
                    <Badge size="sm" type="info">
                      <FormattedMessage id="CollectiveStatus.Frozen" defaultMessage="Frozen" />
                    </Badge>
                  )}
                  {!account.isActive && (
                    <Badge size="sm">
                      <FormattedMessage id="Archived" defaultMessage="Archived" />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        }
      />
      <SheetBody className="pt-0">
        {isLoading ? (
          <React.Fragment>
            <InfoList className="sm:grid-cols-2">
              <InfoListItem
                className="border-t-0"
                title={<FormattedMessage id="Balance" defaultMessage="Balance" />}
                value={<Skeleton className="h-6 w-2/3" />}
              />
              <InfoListItem
                className="sm:col-span-2"
                title={<FormattedMessage id="Team" defaultMessage="Team" />}
                value={<Skeleton className="h-6 w-2/3" />}
              />
            </InfoList>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <InfoList className="sm:grid-cols-2">
              <InfoListItem
                className="border-t-0"
                title={<FormattedMessage id="Balance" defaultMessage="Balance" />}
                value={displayBalance}
              />
              <InfoListItem
                className="sm:col-span-2"
                title={<FormattedMessage id="Team" defaultMessage="Team" />}
                value={
                  <div className="flex flex-wrap gap-4">
                    {account.members?.nodes?.map(admin => (
                      <div className="flex items-center whitespace-nowrap" key={admin.id}>
                        <LinkCollective
                          collective={admin.account}
                          className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-700 hover:underline"
                          withHoverCard
                          hoverCardProps={{ includeAdminMembership: { accountSlug: account.slug } }}
                        >
                          <Avatar collective={admin.account} radius={24} /> {admin.account.name}
                        </LinkCollective>
                      </div>
                    ))}
                  </div>
                }
              />

              <InfoListItem
                className="sm:col-span-2"
                title={<FormattedMessage id="menu.transactions" defaultMessage="Transactions" />}
                value={
                  <div className="flex flex-col gap-2">
                    <DataTable
                      innerClassName="text-xs text-muted-foreground"
                      columns={transactionsTableColumns}
                      data={account.transactions?.nodes || []}
                      mobileTableView
                      compact
                      meta={{ intl }}
                    />

                    <Button
                      className="sm:self-end"
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        router.push(
                          getDashboardRoute(
                            'parent' in account ? account.parent : account,
                            `transactions?account=${account.slug}`,
                          ),
                        )
                      }
                    >
                      <FormattedMessage id="viewTransactions" defaultMessage="View Transactions" />
                    </Button>
                  </div>
                }
              />
              <InfoListItem
                className="sm:col-span-2"
                title={<FormattedMessage id="Activities" defaultMessage="Activities" />}
                value={
                  <div className="flex flex-col gap-2">
                    <DataTable
                      innerClassName="text-xs text-muted-foreground"
                      columns={activitiesTableColumns}
                      data={activities}
                      mobileTableView
                      compact
                      meta={{ intl }}
                    />
                    <Button
                      className="sm:self-end"
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        router.push(
                          getDashboardRoute(
                            'parent' in account ? account.parent : account,
                            `activity-log?account=${account.slug}`,
                          ),
                        )
                      }
                    >
                      <FormattedMessage id="viewActivities" defaultMessage="View Activities" />
                    </Button>
                  </div>
                }
              />
            </InfoList>
          </React.Fragment>
        )}
      </SheetBody>
    </React.Fragment>
  );
};

export default function AccountDrawer({ open, onOpenChange, onCloseAutoFocus, accountId, getActions }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-2xl" onCloseAutoFocus={onCloseAutoFocus}>
        <AccountDetails accountId={accountId} getActions={getActions} />
      </SheetContent>
    </Sheet>
  );
}
