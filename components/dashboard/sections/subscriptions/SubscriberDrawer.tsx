import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { TooltipTrigger } from '@radix-ui/react-tooltip';
import dayjs from 'dayjs';
import { Ban, Info, Link as Link2, Pencil, ShieldCheck } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '@/lib/errors';
import { ExpenseStatus, ExpenseType } from '@/lib/graphql/types/v2/graphql';
import formatAccountType from '@/lib/i18n/account-type';

import { CopyID } from '@/components/CopyId';
import DrawerHeader from '@/components/DrawerHeader';
import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';
import Link from '@/components/Link';
import { useModal } from '@/components/ModalContext';
import { Button } from '@/components/ui/Button';
import { SheetBody } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip, TooltipContent } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/useToast';

import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { InfoList, InfoListItem } from '../../../ui/InfoList';

import { AccountStatusBadges } from './AccountStatusBadges';
import { setSubscriberBlockStatusMutation, subscriberDrawerQuery } from './queries';

const platformBillingsColumns = [
  {
    accessorKey: 'period',
    header: () => <FormattedMessage defaultMessage="Billing Period" id="Fields.billingPeriod" />,
    cell: ({ row }) => {
      const billingData = row.original.platformBillingData;
      if (!billingData) {
        return '';
      }
      return <div className="whitespace-nowrap">{dayjs(billingData.billingPeriod).format('MMMM YYYY')}</div>;
    },
  },
  {
    accessorKey: 'plan',
    header: () => <FormattedMessage id="SubscriptionPlan" defaultMessage="Subscription Plan" />,
    cell: ({ row }) => {
      const billingData = row.original.platformBillingData;
      const plan = billingData?.subscriptions?.[0].plan;
      if (!billingData) {
        return '';
      }
      return <div className="whitespace-nowrap">{plan.title}</div>;
    },
  },
  {
    accessorKey: 'amount',
    header: () => <FormattedMessage defaultMessage="Amount" id="Fields.amount" />,
    cell: ({ cell, row }) => {
      const amount = cell.getValue();
      const billingData = row.original.platformBillingData;
      const additional = billingData?.additional;

      return (
        <div className="flex max-w-min gap-1">
          <span className="truncate font-semibold antialiased">
            <FormattedMoneyAmount
              amount={amount.valueInCents}
              currency={amount.currency}
              precision={2}
              showCurrencyCode={false}
            />
          </span>
          {billingData && (
            <Tooltip>
              <TooltipTrigger>
                <Info size="16px" />
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  <FormattedMessage
                    defaultMessage="Base amount: {amount}"
                    id="BaseAmount"
                    values={{
                      amount: (
                        <FormattedMoneyAmount
                          amount={billingData.baseAmount}
                          currency="USD"
                          precision={2}
                          showCurrencyCode={false}
                        />
                      ),
                    }}
                  />
                </div>
                {additional?.amounts?.activeCollectives > 0 && (
                  <div>
                    <FormattedMessage
                      defaultMessage="{count} active Collectives: {amount}"
                      id="billing.additionalActiveCollectives"
                      values={{
                        count: additional.utilization.activeCollectives,
                        amount: (
                          <FormattedMoneyAmount
                            amount={additional.amounts.activeCollectives}
                            currency="USD"
                            precision={2}
                            showCurrencyCode={false}
                          />
                        ),
                      }}
                    />
                  </div>
                )}
                {additional?.amounts?.expensesPaid > 0 && (
                  <div>
                    <FormattedMessage
                      defaultMessage="{count} Expenses paid: {amount}"
                      id="billing.additionalExpensesPaid"
                      values={{
                        count: additional.utilization.expensesPaid,
                        amount: (
                          <FormattedMoneyAmount
                            amount={additional.amounts.expensesPaid}
                            currency="USD"
                            precision={2}
                            showCurrencyCode={false}
                          />
                        ),
                      }}
                    />
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    meta: { className: 'w-[1%]' },
    header: () => <FormattedMessage id="Fields.status" defaultMessage="Status" />,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="truncate font-semibold antialiased">
          <ExpenseStatusTag
            status={
              expense.type === ExpenseType.PLATFORM_BILLING && expense.status === ExpenseStatus.APPROVED
                ? 'PAYMENT_DUE'
                : expense.status
            }
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'action',
    header: null,
    meta: { className: 'text-right' },
    cell: ({ row }) => {
      const expense = row.original;
      const account = row.original.account;
      return (
        <Button size="icon-xs" variant="outline">
          <Link href={`${account.slug}/expenses/${expense.legacyId}`}>
            <Link2 size="16px" />
          </Link>
        </Button>
      );
    },
  },
];

const SubscriberDrawer = ({ id, openPlanModal }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const { showConfirmationModal } = useModal();
  const {
    data,
    loading: isLoading,
    refetch,
  } = useQuery(subscriberDrawerQuery, {
    variables: { id },

    fetchPolicy: 'cache-and-network',
  });
  const subscriber = data?.account;
  const isBlocked = Boolean(
    subscriber && 'platformSubscription' in subscriber && subscriber.platformSubscription?.isAccountOnHold,
  );
  const [setBlockStatus, { loading: settingBlockStatus }] = useMutation(setSubscriberBlockStatusMutation);

  const toggleBlockStatus = () => {
    showConfirmationModal({
      title: isBlocked
        ? intl.formatMessage({ defaultMessage: 'Unblock this account?', id: 'e/R8uq' })
        : intl.formatMessage({ defaultMessage: 'Block this account for unpaid billing?', id: 'GobD20' }),
      description: isBlocked
        ? intl.formatMessage({
            defaultMessage: 'This will restore the account’s access to restricted features.',
            id: 'Tbtew1',
          })
        : intl.formatMessage({
            defaultMessage:
              'This restricts host actions (e.g. approving applications and paying expenses) until the account is unblocked.',
            id: '/m71yT',
          }),
      variant: isBlocked ? 'default' : 'destructive',
      confirmLabel: isBlocked
        ? intl.formatMessage({ defaultMessage: 'Unblock account', id: 'wahDRS' })
        : intl.formatMessage({ defaultMessage: 'Block for unpaid billing', id: 'abH0gX' }),
      onConfirm: async () => {
        try {
          await setBlockStatus({ variables: { account: { id }, isBlocked: !isBlocked } });
          await refetch();
          toast({
            variant: 'success',
            message: isBlocked
              ? intl.formatMessage({ defaultMessage: 'Account unblocked', id: 'LubhTz' })
              : intl.formatMessage({
                  defaultMessage: 'Account blocked for unpaid platform billing',
                  id: 'Mk7DRS',
                }),
          });
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      },
    });
  };

  const actions = {
    primary: [
      {
        key: 'edit',
        label: intl.formatMessage({ defaultMessage: 'Update Subscription Plan', id: 'd3Ox2g' }),
        onClick: () => {
          openPlanModal(subscriber);
        },
        Icon: Pencil,
      },
      {
        key: 'block',
        label: isBlocked
          ? intl.formatMessage({ defaultMessage: 'Unblock account', id: 'wahDRS' })
          : intl.formatMessage({ defaultMessage: 'Block for unpaid billing', id: 'abH0gX' }),
        onClick: toggleBlockStatus,
        disabled: settingBlockStatus || isLoading,
        Icon: isBlocked ? ShieldCheck : Ban,
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
                  <p className="truncate text-xl font-semibold text-foreground">
                    <LinkCollective collective={subscriber}>{subscriber.name}</LinkCollective>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge size="sm" type="outline">
                    {formatAccountType(intl, subscriber.type)}
                  </Badge>
                  <AccountStatusBadges account={subscriber} />
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

export default SubscriberDrawer;
