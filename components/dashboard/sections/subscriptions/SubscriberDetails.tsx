import React from 'react';
import { useQuery } from '@apollo/client';
import clsx from 'clsx';
import { Pencil } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import formatAccountType from '@/lib/i18n/account-type';

import { CopyID } from '@/components/CopyId';
import DrawerHeader from '@/components/DrawerHeader';
import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';
import Link from '@/components/Link';
import { SheetBody } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { InfoList, InfoListItem } from '../../../ui/InfoList';

import { subscriberDetailQuery } from './queries';

const platformBillingsColumns = [
  {
    accessorKey: 'legacyId',
    header: () => <FormattedMessage defaultMessage="ID" id="Fields.id" />,
    cell: ({ cell, row }) => {
      const account = row.original.account;
      const id = cell.getValue();
      return <Link href={`${account.slug}/expenses/${id}`}>{id}</Link>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage defaultMessage="Submitted At" id="szERSW" />,
    cell: ({ cell, row }) => {
      const createdAt = cell.getValue();
      if (!createdAt) {
        return (
          <div className="whitespace-nowrap text-green-500">
            <DateTime dateStyle="medium" timeStyle="short" value={row.original.createdAt} />
          </div>
        );
      }
      return (
        <div className="whitespace-nowrap">
          <DateTime dateStyle="medium" timeStyle="short" value={createdAt} />
        </div>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: () => <FormattedMessage defaultMessage="Amount" id="Fields.amount" />,
    cell: ({ cell }) => {
      const amount = cell.getValue();

      return (
        <div className={clsx('truncate font-semibold antialiased')}>
          <FormattedMoneyAmount
            amount={amount.valueInCents}
            currency={amount.currency}
            precision={2}
            showCurrencyCode={false}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: () => <FormattedMessage id="Fields.status" defaultMessage="Status" />,
    cell: ({ cell }) => {
      const status = cell.getValue();
      return (
        <div className={clsx('truncate font-semibold antialiased')}>
          <ExpenseStatusTag status={status} />
        </div>
      );
    },
  },
];

const SubscriberDetails = ({ id, openPlanModal }) => {
  const intl = useIntl();
  const { data, loading: isLoading } = useQuery(subscriberDetailQuery, {
    variables: { id },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
  });
  const subscriber = data?.account;
  const actions = {
    primary: [
      {
        key: 'edit',
        label: intl.formatMessage({ defaultMessage: 'Edit Subscription Plan', id: 'cDXQHx' }),
        onClick: () => {
          openPlanModal(subscriber);
        },
        Icon: Pencil,
      },
    ],
  };

  return (
    <React.Fragment>
      <DrawerHeader
        actions={actions}
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
                  <Avatar collective={subscriber} className="" radius={32} />
                  <p className="truncate text-xl font-semibold text-foreground">{subscriber.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge size="sm" type="outline">
                    {formatAccountType(intl, subscriber.type)}
                  </Badge>
                  {subscriber.isFrozen && (
                    <Badge size="sm" type="info">
                      <FormattedMessage id="CollectiveStatus.Frozen" defaultMessage="Frozen" />
                    </Badge>
                  )}
                  {!subscriber.isActive && (
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
      <SheetBody>
        {isLoading ? (
          <React.Fragment>
            <InfoList className="sm:grid-cols-2">
              <InfoListItem
                title={<FormattedMessage id="HostedSince" defaultMessage="Hosted since" />}
                value={<LoadingPlaceholder height={24} width={256} />}
              />
              <InfoListItem
                title={<FormattedMessage id="Balance" defaultMessage="Balance" />}
                value={<LoadingPlaceholder height={24} width={256} />}
              />
              <InfoListItem
                title={<FormattedMessage defaultMessage="Fee Structure" id="CS88Lr" />}
                value={<LoadingPlaceholder height={24} width={256} />}
              />
              <InfoListItem
                title={<FormattedMessage defaultMessage="Expense Types" id="D+aS5Z" />}
                value={<LoadingPlaceholder height={24} width={256} />}
              />
              <InfoListItem
                className="sm:col-span-2"
                title={<FormattedMessage id="Team" defaultMessage="Team" />}
                value={<LoadingPlaceholder height={24} width={400} />}
              />
            </InfoList>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <InfoList className="flex flex-col sm:grid sm:grid-cols-2">
              <InfoListItem
                className="border-t-0"
                title={<FormattedMessage id="JoinedAt" defaultMessage="Joined At" />}
                value={<FormattedDate value={subscriber.createdAt} day="numeric" month="long" year="numeric" />}
              />
              <InfoListItem
                className="border-t-0"
                title={<FormattedMessage id="SubscriptionPlan" defaultMessage="Subscription Plan" />}
                value={
                  'platformSubscription' in subscriber && subscriber.platformSubscription.plan ? (
                    subscriber.platformSubscription.plan.title
                  ) : (
                    <FormattedMessage id="NoPlan" defaultMessage="No plan" />
                  )
                }
              />
              <InfoListItem
                title={<FormattedMessage id="MoneyManaged" defaultMessage="Money Managed" />}
                value={
                  <FormattedMoneyAmount
                    amount={subscriber.stats?.managedAmount.valueInCents}
                    currency={subscriber.stats?.managedAmount.currency}
                    showCurrencyCode={true}
                  />
                }
              />
              <InfoListItem
                title={<FormattedMessage id="Balance" defaultMessage="Balance" />}
                value={
                  <FormattedMoneyAmount
                    amount={subscriber.stats?.balance.valueInCents}
                    currency={subscriber.stats?.balance.currency}
                    showCurrencyCode={true}
                  />
                }
              />
              <InfoListItem
                className="sm:col-span-2"
                title={<FormattedMessage id="Team" defaultMessage="Team" />}
                value={
                  <div className="flex flex-wrap gap-4">
                    {subscriber.members?.nodes?.map(admin => (
                      <div className="flex items-center whitespace-nowrap" key={admin.id}>
                        <LinkCollective
                          collective={admin.account}
                          className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-700 hover:underline"
                          withHoverCard
                          hoverCardProps={{ includeAdminMembership: { accountSlug: subscriber.slug } }}
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
                title={<FormattedMessage id="PastPlatformBillings" defaultMessage="Platform Billings" />}
                value={
                  <div className="flex flex-col gap-2">
                    <DataTable
                      innerClassName="text-xs text-muted-foreground"
                      columns={platformBillingsColumns}
                      data={subscriber.expenses?.nodes || []}
                      mobileTableView
                      compact
                      meta={{ intl }}
                    />
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

export default SubscriberDetails;
