import React, { useState } from 'react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { flatten, groupBy, sortBy, startCase, uniq } from 'lodash';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  CircleCheckBig,
  CircleStop,
  Hourglass,
  Info,
  MoreHorizontalIcon,
  Pencil,
  Plus,
  RefreshCcw,
  TriangleAlert,
  Undo2,
  Wallet,
} from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { ContributionDrawerQuery } from '../../lib/graphql/types/v2/graphql';
import { ActivityType, ContributionFrequency, OrderStatus, TransactionKind } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import type LoggedInUser from '../../lib/LoggedInUser';
import { getDashboardRoute } from '../../lib/url-helpers';

import ActivityDescription, { getActivityVariables } from '../dashboard/sections/ActivityLog/ActivityDescription';
import { useTransactionActions } from '../dashboard/sections/transactions/actions';
import DateTime from '../DateTime';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';

type OrderTimelineProps = {
  order: ContributionDrawerQuery['order'];
};

type OrderTimelineItem = {
  id: string;
  title: React.ReactNode;
  icon: React.ReactNode;
  date: string | Date;
  expected?: boolean;
  details?: React.ReactNode;
  type?: 'error' | 'warning' | 'success' | 'info';
  collapsable?: boolean;
  collapseGroup?: string;
  normallyOpen?: boolean;
  menu?: React.ReactNode;
};

type TransactionGroup = {
  group: string;
  transactions: ContributionDrawerQuery['order']['transactions'];
};

function buildTransactionGroups(order: ContributionDrawerQuery['order']): TransactionGroup[] {
  const transactions = order?.transactions ?? [];
  if (transactions.length === 0) {
    return [];
  }

  const groups = uniq(transactions.map(txn => txn.group));
  const byGroup = groupBy(transactions, txn => txn.group);

  const KIND_PRIORITY = [TransactionKind.CONTRIBUTION, TransactionKind.ADDED_FUNDS, TransactionKind.BALANCE_TRANSFER];
  return groups.map(group => ({
    group,
    transactions: byGroup[group].sort((a, b) => {
      if (KIND_PRIORITY.includes(a.kind) && !KIND_PRIORITY.includes(b.kind)) {
        return -1;
      } else if (!KIND_PRIORITY.includes(a.kind) && KIND_PRIORITY.includes(b.kind)) {
        return 1;
      }
      return a.createdAt - b.createdAt;
    }),
  }));
}

export function getTransactionsUrl(LoggedInUser: LoggedInUser, order: ContributionDrawerQuery['order']): URL {
  let route = `/${order.toAccount.slug}/transactions`;
  if (LoggedInUser.isSelf(order.fromAccount)) {
    route = getDashboardRoute(order.fromAccount, 'transactions');
  } else if ('host' in order.toAccount && LoggedInUser.canSeeAdminPanel(order.toAccount.host)) {
    route = getDashboardRoute(order.toAccount.host, 'host-transactions');
  } else if (LoggedInUser.canSeeAdminPanel(order.toAccount)) {
    route = getDashboardRoute(order.toAccount, 'transactions');
  }

  return new URL(route, window.location.origin);
}

function getTransactionGroupLink(
  LoggedInUser: LoggedInUser,
  order: ContributionDrawerQuery['order'],
  transactionGroup: string,
): string {
  const url = getTransactionsUrl(LoggedInUser, order);
  url.searchParams.set('group', transactionGroup);
  return url.toString();
}

const formatValue = (key: string, value: any, context: any) => {
  switch (key) {
    case 'totalAmount':
    case 'paymentProcessorFee':
    case 'amount':
    case 'taxAmount':
      return <FormattedMoneyAmount amount={value} currency={context.currency} />;
    default:
      return value.toString();
  }
};

const wrapInDiv = (content: React.ReactNode, i) => <div key={i}>{content}</div>;

const formatSimpleDiff = (prev, next, context, key = '') => {
  const formattedKey = startCase(key);
  if (typeof prev === 'object' && typeof next === 'object') {
    const keys = uniq([...Object.keys(prev), ...Object.keys(next)]);
    return (
      <div className="flex flex-col">
        {flatten(keys.map(k => formatSimpleDiff(prev[k], next[k], context, k))).map(wrapInDiv)}
      </div>
    );
  } else if ((!prev && typeof next === 'object') || (!next && typeof prev === 'object')) {
    return;
  } else if (prev && !next) {
    return <FormattedMessage defaultMessage="Removed {formattedKey}" id="4th9pU" values={{ formattedKey }} />;
  } else if (!prev && next) {
    return (
      <FormattedMessage
        defaultMessage="Added {formattedKey} {value}"
        id="ZHm2jf"
        values={{ formattedKey, value: formatValue(key, next, context) }}
      />
    );
  } else if (prev !== next) {
    return (
      <FormattedMessage
        defaultMessage="Changed {formattedKey} from {prev} to {next}"
        id="2q7N9A"
        values={{ formattedKey, prev: formatValue(key, prev, context), next: formatValue(key, next, context) }}
      />
    );
  }
};

const typeIsNot = types => activity => !types.includes(activity.type);

const getIcon = (type: ActivityType) => {
  switch (type) {
    case ActivityType.PAYMENT_CREDITCARD_CONFIRMATION:
    case ActivityType.ORDER_PAYMENT_FAILED:
    case ActivityType.PAYMENT_FAILED:
    case ActivityType.ORDER_PENDING_EXPIRED:
    case ActivityType.ORDER_DISPUTE_CREATED:
    case ActivityType.ORDER_DISPUTE_CLOSED:
    case ActivityType.CONTRIBUTION_REJECTED:
      return <TriangleAlert size={16} />;
    case ActivityType.SUBSCRIPTION_CANCELED:
      return <CircleStop size={16} />;
    case ActivityType.ORDER_PROCESSING:
    case ActivityType.ORDER_PENDING_CONTRIBUTION_REMINDER:
      return <Hourglass size={16} />;
    case ActivityType.ADDED_FUNDS_EDITED:
      return <Pencil size={16} />;
    default:
      return <Info size={16} />;
  }
};

const getActivityStyle = (type: ActivityType) => {
  switch (type) {
    case ActivityType.CONTRIBUTION_REJECTED:
    case ActivityType.ORDER_PAYMENT_FAILED:
    case ActivityType.ORDER_PENDING_EXPIRED:
    case ActivityType.PAYMENT_FAILED:
    case ActivityType.SUBSCRIPTION_CANCELED:
      return 'error';
    case ActivityType.ORDER_DISPUTE_CLOSED:
    case ActivityType.ORDER_DISPUTE_CREATED:
    case ActivityType.ORDER_PENDING_CONTRIBUTION_REMINDER:
    case ActivityType.PAYMENT_CREDITCARD_CONFIRMATION:
    case ActivityType.ADDED_FUNDS_EDITED:
      return 'warning';
    default:
      return 'info';
  }
};

function ContributionTimeline(props: OrderTimelineProps) {
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const [collapseGroupsToggle, setCollapseGroupsToggle] = useState({});
  const getTransactionActions = useTransactionActions();

  const toggleGroup = React.useCallback((group: string) => {
    setCollapseGroupsToggle(cur => {
      if (Object.hasOwn(cur, group)) {
        const newValue = { ...cur };
        delete newValue[group];
        return newValue;
      } else {
        return { ...cur, [group]: true };
      }
    });
  }, []);

  const activities: OrderTimelineItem[] = props.order.activities.nodes
    .filter(
      typeIsNot([
        ActivityType.COLLECTIVE_TRANSACTION_CREATED,
        ActivityType.ORDER_PENDING_CREATED,
        ActivityType.ORDER_PENDING_RECEIVED,
        ActivityType.ORDER_PENDING,
      ]),
    )
    .map(a => {
      const details =
        a.data?.previousData &&
        formatSimpleDiff(a.data.previousData, a.data.newData, { currency: props.order.totalAmount.currency });

      return {
        id: a.id,
        title: <ActivityDescription activity={a} />,
        collapsable: [ActivityType.PAYMENT_FAILED, ActivityType.ADDED_FUNDS_EDITED].includes(a.type),
        icon: getIcon(a.type),
        date: a.createdAt,
        details,
        type: getActivityStyle(a.type),
        menu: a.data?.paymentProcessorUrl ? (
          <React.Fragment>
            <DropdownMenuItem asChild>
              <Button size="xs" variant="ghost" asChild className="w-full">
                <Link href={a.data?.paymentProcessorUrl} className="justify-start">
                  <FormattedMessage defaultMessage="View in payment processor" id="NgSLbI" />
                </Link>
              </Button>
            </DropdownMenuItem>
          </React.Fragment>
        ) : null,
      };
    });

  const transactions: OrderTimelineItem[] = sortBy(
    buildTransactionGroups(props.order),
    txn => txn.transactions.at(0).createdAt,
  )
    .reverse()
    .map((txn, i) => {
      const primaryTxn = txn.transactions.at(0);
      const actions = getTransactionActions(primaryTxn);
      const title = primaryTxn.isRefund ? (
        <FormattedMessage
          defaultMessage="<Individual></Individual> refunded contribution"
          id="HIxijU"
          values={{ ...getActivityVariables(intl, props.order) }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="<Individual></Individual> sucessfully paid contribution"
          id="OD2ut4"
          values={{ ...getActivityVariables(intl, props.order) }}
        />
      );

      return {
        id: txn.group,
        title,
        icon: primaryTxn.isRefund ? <Undo2 size={16} /> : <CircleCheckBig size={16} />,
        date: primaryTxn.createdAt,
        collapsable: true,
        type: primaryTxn.isRefund ? 'warning' : 'success',
        normallyOpen: i === 0,
        menu: (
          <React.Fragment>
            <DropdownMenuItem asChild>
              <Button size="xs" variant="ghost" asChild className="w-full justify-start">
                <Link href={getTransactionGroupLink(LoggedInUser, props.order, txn.group)}>
                  <FormattedMessage defaultMessage="View transaction" id="1kZ3H0" />
                </Link>
              </Button>
            </DropdownMenuItem>
            {primaryTxn.paymentProcessorUrl && (
              <DropdownMenuItem asChild>
                <Button size="xs" variant="ghost" asChild className="w-full justify-start">
                  <Link href={primaryTxn.paymentProcessorUrl}>
                    <FormattedMessage defaultMessage="View in payment processor" id="NgSLbI" />
                  </Link>
                </Button>
              </DropdownMenuItem>
            )}
            {actions.primary?.map((action, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <DropdownMenuItem key={i} asChild className="w-full">
                <Button size="xs" variant="ghost" onClick={action.onClick} className="justify-start">
                  {action.label}
                </Button>
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ),
      };
    });

  const otherActivities: OrderTimelineItem[] = [];

  if (
    props.order.frequency !== ContributionFrequency.ONETIME &&
    [OrderStatus.ACTIVE, OrderStatus.PROCESSING].includes(props.order.status) &&
    dayjs(props.order.nextChargeDate).isAfter(new Date())
  ) {
    otherActivities.push({
      id: 'next-charge-date',
      title: <FormattedMessage defaultMessage="Next subscription cycle" id="qzsea6" />,
      icon: <Wallet size={16} />,
      date: props.order.nextChargeDate as string,
      expected: true,
      type: 'info',
    });
  }

  const latestProcessingEvent = props.order.activities.nodes.findLast(a => a.type === ActivityType.ORDER_PROCESSING);
  const latestChargeEvent = transactions.length > 0 ? sortBy(transactions, 'date').at(-1) : null;

  if (
    props.order.status === OrderStatus.PROCESSING &&
    latestProcessingEvent &&
    (!latestChargeEvent || dayjs(latestChargeEvent.date).isBefore(dayjs(latestProcessingEvent.createdAt)))
  ) {
    // is waiting processing.
    const expectedChargeDate = dayjs(latestProcessingEvent.createdAt).add(14, 'day');
    otherActivities.push({
      id: 'expected-processing-end',
      title: <FormattedMessage defaultMessage="Expected date to complete processing charge" id="26Lp/C" />,
      icon: <Calendar size={16} />,
      date: expectedChargeDate.toISOString(),
      expected: true,
      type: 'info',
    });
  }

  if (
    props.order.frequency !== ContributionFrequency.ONETIME &&
    props.order.status === OrderStatus.ERROR &&
    dayjs(props.order.nextChargeDate).isAfter(new Date())
  ) {
    otherActivities.push({
      id: 'next-charge-attempt',
      title: <FormattedMessage defaultMessage="Next charge attempt" id="ud3Qe6" />,
      icon: <RefreshCcw size={16} />,
      date: props.order.nextChargeDate as string,
      expected: true,
      type: 'info',
    });
  }

  if (props.order.status === OrderStatus.PENDING && props.order.pendingContributionData?.expectedAt) {
    otherActivities.push({
      id: 'expected-funds',
      title: <FormattedMessage defaultMessage="Expected date for funds received" id="2f9kCJ" />,
      icon: <Calendar size={16} />,
      date: props.order.pendingContributionData.expectedAt as string,
      expected: true,
      type: 'info',
    });
  }

  otherActivities.push({
    id: 'order-created',
    title: (
      <FormattedMessage
        defaultMessage="<Individual></Individual> initiated a contribution"
        id="80wEGv"
        values={getActivityVariables(intl, props.order)}
      />
    ),
    icon: <Plus size={16} />,
    date: props.order.createdAt as string,
    collapsable: true,
    type: 'info',
  });

  let lastCollapseGroup;
  const timeline: OrderTimelineItem[] = sortBy([...activities, ...transactions, ...otherActivities], 'date')
    .reverse()
    .map((item, i, arr) => {
      const lastItem = i - 1 >= 0 ? arr[i - 1] : null;

      if (lastItem?.collapsable && !item.collapsable) {
        lastCollapseGroup = lastItem.id;
        return { ...item, collapseGroup: lastItem.id };
      } else if (lastCollapseGroup && !item.collapsable) {
        return { ...item, collapseGroup: lastCollapseGroup };
      } else {
        lastCollapseGroup = null;
      }

      return item;
    });

  return (
    <ol className="mt-3 pl-3">
      {timeline.map((t, itemIndex) => {
        const collapseParent = t.collapseGroup ? timeline.find(item => item.id === t.collapseGroup) : null;
        if (
          collapseParent &&
          (collapseParent.normallyOpen
            ? Object.hasOwn(collapseGroupsToggle, collapseParent.id)
            : !Object.hasOwn(collapseGroupsToggle, collapseParent.id))
        ) {
          return null;
        }
        const hasChild = t.collapsable ? timeline.some(item => item.collapseGroup === t.id) : false;
        const isCollapsed =
          hasChild &&
          t.collapsable &&
          (t.normallyOpen ? Object.hasOwn(collapseGroupsToggle, t.id) : !Object.hasOwn(collapseGroupsToggle, t.id));
        return (
          <React.Fragment key={t.id}>
            <li
              className={clsx('relative border-l border-[#E1E7EF] pb-10 pl-9 last:border-none last:pb-0', {
                'border-dashed': t.expected,
              })}
            >
              <div
                className={clsx('absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8', {
                  'bg-[#FFF0F1] text-[#FF3053] ring-[#FFF0F1]': t.type === 'error',
                  'bg-[#FEFEE8] text-[#A27006] ring-[#FEFEE8]': t.type === 'warning',
                  'bg-[#EAFFE9] text-[#098605] ring-[#EAFFE9]': t.type === 'success',
                  'bg-[#EEF7FF] text-[#308EFF] ring-[#EEF7FF]': t.type === 'info',
                })}
              >
                {t.icon}
              </div>
              <div className="relative flex items-center">
                {itemIndex !== 0 && <div className="absolute -top-5 w-full border-t border-[#E1E7EF]"></div>}
                <div>
                  <div>{t.title}</div>
                  <div className="text-xs leading-5 text-[#75777A]">
                    <DateTime value={t.date} timeStyle="short" />
                  </div>
                  {t.details && <div className="mt-2">{t.details}</div>}
                </div>
                <div className="ml-auto flex gap-2">
                  {t.menu && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <MoreHorizontalIcon size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>{t.menu}</DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {t.collapsable && hasChild && (
                    <Button variant="ghost" size="icon-xs" onClick={() => toggleGroup(t.id)}>
                      {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
}

export default ContributionTimeline;
