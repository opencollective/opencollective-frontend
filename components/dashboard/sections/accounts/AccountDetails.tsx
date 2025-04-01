import React from 'react';
import { useQuery } from '@apollo/client';
import clsx from 'clsx';
import { groupBy } from 'lodash';
import { AlertTriangle, ArrowLeft, ArrowRight, Undo } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../../../lib/constants/collectives';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  DashboardAccountsQueryFieldsFragment,
  HostedCollectiveFieldsFragment,
} from '../../../../lib/graphql/types/v2/graphql';
import type { AccountWithHost } from '../../../../lib/graphql/types/v2/schema';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { i18nTransactionKind } from '../../../../lib/i18n/transaction';
import { elementFromClass } from '../../../../lib/react-utils';
import { getDashboardRoute } from '../../../../lib/url-helpers';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import { DataTable } from '../../../table/DataTable';
import { H4 } from '../../../Text';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { InfoList, InfoListItem } from '../../../ui/InfoList';
import ActivityDescription from '../ActivityLog/ActivityDescription';
import { ActivityUser } from '../ActivityLog/ActivityUser';

import type { HostedCollectivesDataTableMeta } from './common';
import { cols } from './common';
import { accountDetailQuery } from './queries';
import { Sheet, SheetBody, SheetContent } from '@/components/ui/Sheet';
import DrawerHeader from '@/components/DrawerHeader';
import { GetActions } from '@/lib/actions/types';
import { Skeleton } from '@/components/ui/Skeleton';

type CollectiveDetailsProps = {
  // collective?: HostedCollectiveFieldsFragment & Partial<AccountWithHost>;
  collectiveId?: string;
  // loading?: boolean;
  // onCancel: () => void;
  // openCollectiveDetails: (HostedCollectiveFieldsFragment) => void;
  getActions: GetActions<DashboardAccountsQueryFieldsFragment>;
};

const SectionTitle = elementFromClass('div', 'text-md font-bold text-slate-800 mb-2 flex gap-4 items-center');

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

const AccountDetails = ({ collectiveId, openCollectiveDetails, getActions }: CollectiveDetailsProps) => {
  const intl = useIntl();
  const router = useRouter();
  const { data, loading, refetch } = useQuery(accountDetailQuery, {
    variables: { id: collectiveId },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
  });
  const dropdownTriggerRef = React.useRef();
  const account = data?.account;

  const actions = getActions(account, dropdownTriggerRef, refetch);

  const activities = data?.activities?.nodes;
  const isLoading = loading;
  const isChild = !!account?.parent?.id;

  const children = groupBy(account?.childrenAccounts?.nodes, 'type');
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
        entityIdentifier={
          collectiveId
          // <CopyID value={id} tooltipLabel={<FormattedMessage defaultMessage="Copy transaction ID" id="zzd7ZI" />}>
          //   #{id}
          // </CopyID>
        }
        entityLabel={<div />}

        // entityLabel={
        //   <div>
        //     {isLoading ? (
        //       <Skeleton className="h-8 w-64" />
        //     ) : (
        //       <div className="flex items-center gap-3">
        //         <Avatar collective={account} radius={32} />
        //         <div className={'text-xl font-semibold text-foreground'}>{account.name}</div>
        //         <Badge type="outline" size="sm">
        //           {formatCollectiveType(intl, account.type)}
        //         </Badge>
        //       </div>
        //     )}
        //   </div>
        // }
      />
      <SheetBody className="">
        {isLoading ? (
          <React.Fragment>
            <Skeleton className="h-8 w-64" />

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
            <div className="flex items-center gap-3">
              <Avatar collective={account} radius={32} />
              <div className={'text-xl font-semibold text-foreground'}>{account.name}</div>
              <Badge type="outline" size="sm">
                {formatCollectiveType(intl, account.type)}
              </Badge>
            </div>
            {/* <SectionTitle>
              <Avatar collective={collective} radius={48} />
              <div>
                <div className="flex flex-row">
                  <LinkCollective
                    collective={collective}
                    className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-700 hover:underline"
                  >
                    {collective.name}
                  </LinkCollective>
                </div>
              </div>
            </SectionTitle> */}
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
              {[CollectiveType.PROJECT, CollectiveType.EVENT].map(
                type =>
                  children[type] && (
                    <InfoListItem
                      key={type}
                      className="sm:col-span-2"
                      title={
                        <span className="text-base">{formatCollectiveType(intl, type, children[type].length)}</span>
                      }
                      value={
                        <DataTable
                          innerClassName="text-xs text-muted-foreground"
                          columns={[cols.childCollective, cols.fee, cols.hostedSince, cols.balance, cols.actions]}
                          data={children[type] || []}
                          mobileTableView
                          compact
                          meta={
                            {
                              intl,
                              onClickRow: row => openCollectiveDetails(row.original),
                              openCollectiveDetails,
                            } as HostedCollectivesDataTableMeta
                          }
                          onClickRow={row => openCollectiveDetails(row.original)}
                        />
                      }
                    />
                  ),
              )}
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
                      onClick={() => router.push(getDashboardRoute(account, `transactions`))}
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
                      onClick={() => router.push(getDashboardRoute(account, `activity-log`))}
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

export default AccountDetails;

export function AccountDrawer({ open, onOpenChange, onCloseAutoFocus, collectiveId, getActions }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-2xl" onCloseAutoFocus={onCloseAutoFocus}>
        <AccountDetails collectiveId={collectiveId} getActions={getActions} />
      </SheetContent>
    </Sheet>
  );
}
