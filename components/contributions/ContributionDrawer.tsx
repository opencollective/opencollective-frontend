import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { groupBy, isEmpty, sortBy, uniq } from 'lodash';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheckBig,
  CircleStop,
  Hourglass,
  Info,
  Link as LinkIcon,
  MoreHorizontalIcon,
  Plus,
  RefreshCcw,
  TriangleAlert,
  Wallet,
  X,
} from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import type { LoggedInUser as LoggedInUserType } from '../../lib/custom_typings/LoggedInUser';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  ActivityType,
  ContributionDrawerQuery,
  ContributionDrawerQueryVariables,
  ContributionFrequency,
  OrderStatus,
  TransactionKind,
  TransactionType,
} from '../../lib/graphql/types/v2/graphql';
import useClipboard from '../../lib/hooks/useClipboard';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { i18nPaymentMethodProviderType } from '../../lib/i18n/payment-method-provider-type';
import { getDashboardRoute } from '../../lib/url-helpers';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import ActivityDescription from '../dashboard/sections/ActivityLog/ActivityDescription';
import DateTime from '../DateTime';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import OrderStatusTag from '../orders/OrderStatusTag';
import PaymentMethodTypeWithIcon from '../PaymentMethodTypeWithIcon';
import Tags from '../Tags';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { Sheet, SheetContent, SheetFooter } from '../ui/Sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

import { ContributionContextualMenu, ContributionContextualMenuProps } from './ContributionContextualMenu';

type ContributionDrawerProps = {
  open: boolean;
  onClose: () => void;
  orderId?: number;
  orderUrl: string;
} & ContributionContextualMenuProps;

const I18nFrequencyMessages = defineMessages({
  [ContributionFrequency.ONETIME]: {
    id: 'Frequency.OneTime',
    defaultMessage: 'One time',
  },
  [ContributionFrequency.MONTHLY]: {
    id: 'Frequency.Monthly',
    defaultMessage: 'Monthly',
  },
  [ContributionFrequency.YEARLY]: {
    id: 'Frequency.Yearly',
    defaultMessage: 'Yearly',
  },
});

export function ContributionDrawer(props: ContributionDrawerProps) {
  const clipboard = useClipboard();
  const intl = useIntl();

  const { LoggedInUser } = useLoggedInUser();

  const query = useQuery<ContributionDrawerQuery, ContributionDrawerQueryVariables>(
    gql`
      query ContributionDrawer($orderId: Int!) {
        order(order: { legacyId: $orderId }) {
          id
          legacyId
          nextChargeDate
          amount {
            value
            valueInCents
            currency
          }
          totalAmount {
            value
            valueInCents
            currency
          }
          paymentMethod {
            id
            type
          }
          status
          description
          createdAt
          processedAt
          frequency
          tier {
            id
            name
            description
          }
          fromAccount {
            ...ContributionDrawerAccountFields
            ... on AccountWithHost {
              host {
                id
                slug
              }
            }
          }
          toAccount {
            ...ContributionDrawerAccountFields
          }
          platformTipEligible
          platformTipAmount {
            value
            valueInCents
            currency
          }
          hostFeePercent
          tags
          tax {
            type
            idNumber
            rate
          }
          accountingCategory {
            id
            name
            friendlyName
            code
          }
          activities {
            nodes {
              id
              type
              createdAt
              fromAccount {
                ...ContributionDrawerAccountFields
              }
              account {
                ...ContributionDrawerAccountFields
              }
              host {
                ...ContributionDrawerAccountFields
              }
              individual {
                ...ContributionDrawerAccountFields
              }
              data
              transaction {
                ...ContributionDrawerTransactionFields
              }
            }
          }
          customData
          memo
          needsConfirmation
          pendingContributionData {
            expectedAt
            paymentMethod
            ponumber
            memo
            fromAccountInfo {
              name
              email
            }
          }
          transactions {
            ...ContributionDrawerTransactionFields
          }
          permissions {
            id
            canResume
            canMarkAsExpired
            canMarkAsPaid
            canEdit
            canComment
            canSeePrivateActivities
            canSetTags
            canUpdateAccountingCategory
          }
        }
      }

      fragment ContributionDrawerAccountFields on Account {
        id
        name
        slug
        isIncognito
        type
        imageUrl
        hasImage
        isHost
        isArchived
        ... on Individual {
          isGuest
        }
        ... on AccountWithHost {
          host {
            id
            slug
          }
          approvedAt
        }

        ... on AccountWithParent {
          parent {
            id
            slug
          }
        }
      }

      fragment ContributionDrawerTransactionFields on Transaction {
        id
        kind
        amount {
          currency
          valueInCents
        }
        netAmount {
          currency
          valueInCents
        }
        group
        type
        description
        createdAt
        isRefunded
        isRefund
        isOrderRejected
        account {
          ...ContributionDrawerAccountFields
        }
        oppositeAccount {
          ...ContributionDrawerAccountFields
        }
        expense {
          id
          type
        }
        permissions {
          id
          canRefund
          canDownloadInvoice
          canReject
        }
        paymentProcessorUrl
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        orderId: props.orderId,
      },
      skip: !props.open || !props.orderId,
    },
  );

  const isLoading = !query.called || query.loading || !query.data || query.data.order?.legacyId !== props.orderId;

  return (
    <Sheet open={props.open} onOpenChange={isOpen => !isOpen && props.onClose()}>
      <SheetContent className="flex max-w-xl flex-col overflow-hidden">
        <div className="flex-grow overflow-auto px-8 py-4">
          {query.error ? (
            <MessageBoxGraphqlError error={query.error} />
          ) : (
            <React.Fragment>
              <div className="flex items-center">
                <div className="flex items-center gap-2 text-lg font-bold">
                  <FormattedMessage defaultMessage="Contribution" id="0LK5eg" />
                  <div>{isLoading ? <LoadingPlaceholder height={20} /> : `# ${query.data.order.legacyId}`}</div>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onPointerDown={e => {
                          e.stopPropagation();
                        }}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          clipboard.copy(props.orderUrl);
                        }}
                      >
                        <LinkIcon size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {clipboard.isCopied ? (
                        <div className="flex items-center gap-1">
                          <Check size={16} />
                          <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
                        </div>
                      ) : (
                        <FormattedMessage id="Clipboard.CopyShort" defaultMessage="Copy" />
                      )}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {query.data?.order?.status && <OrderStatusTag status={query.data.order.status} />}
                  <Button variant="ghost" size="icon-sm" onClick={props.onClose}>
                    <X size={16} />
                  </Button>
                </div>
              </div>
              <div className="mb-4">
                {isLoading ? (
                  <LoadingPlaceholder height={20} />
                ) : (
                  <Tags canEdit={query.data?.order?.permissions?.canSetTags} order={query.data?.order} />
                )}
              </div>
              <div className="mb-6">
                <div>{isLoading ? <LoadingPlaceholder height={20} /> : query.data.order.description}</div>
              </div>
              <div className="text-sm">
                <div className="mb-4 grid grid-cols-3 gap-4 gap-y-6 text-sm [&>*>*:first-child]:mb-2 [&>*>*:first-child]:font-bold">
                  <div>
                    <div>Contributor</div>
                    <div>
                      {isLoading ? (
                        <LoadingPlaceholder height={20} />
                      ) : (
                        <AccountHoverCard
                          account={query.data.order.fromAccount}
                          trigger={
                            <Link
                              className="flex items-center gap-1 hover:text-primary hover:underline"
                              href={`/${query.data.order.fromAccount.slug}`}
                            >
                              <Avatar radius={20} collective={query.data.order.fromAccount} />
                              {query.data.order.fromAccount.name}
                            </Link>
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <div>Collective</div>
                    <div>
                      {isLoading ? (
                        <LoadingPlaceholder height={20} />
                      ) : (
                        <AccountHoverCard
                          account={query.data.order.toAccount}
                          trigger={
                            <Link
                              className="flex items-center gap-1 hover:text-primary hover:underline"
                              href={`/${query.data.order.toAccount.slug}`}
                            >
                              <Avatar radius={20} collective={query.data.order.toAccount} />
                              {query.data.order.toAccount.name}
                            </Link>
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <div>Payment Method</div>
                    <div>
                      {isLoading ? (
                        <LoadingPlaceholder height={20} />
                      ) : query.data.order.status === OrderStatus.PENDING ? (
                        i18nPaymentMethodProviderType(intl, query.data.order.pendingContributionData.paymentMethod)
                      ) : (
                        <PaymentMethodTypeWithIcon type={query.data.order.paymentMethod?.type} iconSize={16} />
                      )}
                    </div>
                  </div>

                  {query.data?.order?.status === OrderStatus.PENDING && (
                    <React.Fragment>
                      {query.data.order.pendingContributionData.ponumber && (
                        <div className="col-span-3">
                          <div>
                            <FormattedMessage defaultMessage="PO Number" id="Fields.PONumber" />
                          </div>
                          <div>{query.data.order.pendingContributionData.ponumber}</div>
                        </div>
                      )}
                      <div className="col-span-3">
                        <div>
                          <FormattedMessage defaultMessage="Contact" id="Contact" />
                        </div>
                        <div>
                          {`${query.data.order.pendingContributionData.fromAccountInfo.name} (${query.data.order.pendingContributionData.fromAccountInfo.email})`}
                        </div>
                      </div>
                    </React.Fragment>
                  )}

                  <div className="col-span-3">
                    <div>Frequency</div>
                    <div>
                      {isLoading ? (
                        <LoadingPlaceholder height={20} />
                      ) : !query.data.order.frequency ? (
                        <FormattedMessage {...I18nFrequencyMessages[ContributionFrequency.ONETIME]} />
                      ) : (
                        <FormattedMessage {...I18nFrequencyMessages[query.data.order.frequency]} />
                      )}
                    </div>
                  </div>

                  <div className="col-span-3">
                    <div>Amount</div>
                    <div>
                      {isLoading ? (
                        <LoadingPlaceholder height={20} />
                      ) : (
                        <div className="grid grid-cols-[1fr_auto] gap-1 text-sm">
                          <div>
                            <FormattedMessage defaultMessage="Contribution" id="0LK5eg" />
                          </div>
                          <div className="text-right">
                            <FormattedMoneyAmount
                              amountStyles={{ letterSpacing: 0 }}
                              showCurrencyCode
                              currency={query.data.order.amount.currency}
                              amount={query.data.order.amount.valueInCents}
                            />
                          </div>
                          {query.data.order.platformTipAmount?.valueInCents ? (
                            <React.Fragment>
                              <div>
                                <FormattedMessage defaultMessage="Platform Tip" id="Mwxcaq" />
                              </div>
                              <div className="text-right">
                                <FormattedMoneyAmount
                                  amountStyles={{ letterSpacing: 0 }}
                                  showCurrencyCode
                                  currency={query.data.order.platformTipAmount.currency}
                                  amount={query.data.order.platformTipAmount.valueInCents}
                                />
                              </div>
                            </React.Fragment>
                          ) : null}
                          {query.data.order.tax && (
                            <React.Fragment>
                              <div>
                                <FormattedMessage defaultMessage="Taxes" id="r+dgiv" />
                              </div>
                              <div className="text-right">
                                <FormattedMoneyAmount
                                  amountStyles={{ letterSpacing: 0 }}
                                  showCurrencyCode={false}
                                  currency={query.data.order.amount.currency}
                                  amount={(query.data.order.tax?.rate ?? 0) * query.data.order.amount.valueInCents}
                                />
                              </div>
                            </React.Fragment>
                          )}
                          <div className="contents [&>div]:mt-2 [&>div]:border-t [&>div]:pt-2 [&>div]:font-semibold">
                            <div>
                              <FormattedMessage defaultMessage="Total" id="MJ2jZQ" />
                            </div>
                            <div className="text-right">
                              <FormattedMoneyAmount
                                amountStyles={{ letterSpacing: 0 }}
                                showCurrencyCode
                                currency={query.data.order.totalAmount.currency}
                                amount={query.data.order.totalAmount.valueInCents}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {query.data?.order?.memo ||
                    (query.data?.order?.pendingContributionData?.memo && (
                      <div>
                        <div>Memo</div>
                        <div>{query.data.order.memo || query.data.order.pendingContributionData.memo}</div>
                      </div>
                    ))}
                  {!isEmpty(query.data?.order?.customData) && (
                    <div>
                      <div>Custom Data</div>
                      <div>{JSON.stringify(query.data.order.customData)}</div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 py-4">
                    <div className="text-slate-80 w-fit text-base font-bold leading-6">
                      <FormattedMessage defaultMessage="Related Activity" id="LP8cIK" />
                    </div>
                    <hr className="flex-grow border-neutral-300" />
                    <Button asChild variant="outline" size="xs" disabled={isLoading} loading={isLoading}>
                      <Link href={query.data?.order ? getTransactionOrderLink(LoggedInUser, query.data.order) : '#'}>
                        <FormattedMessage defaultMessage="View transactions" id="DfQJQ6" />
                      </Link>
                    </Button>
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col gap-1">
                      <LoadingPlaceholder height={20} />
                      <LoadingPlaceholder height={20} />
                      <LoadingPlaceholder height={20} />
                      <LoadingPlaceholder height={20} />
                    </div>
                  ) : (
                    <OrderTimeline order={query.data.order} />
                  )}
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
        <SheetFooter className="flex px-8 py-2">
          <ContributionContextualMenu
            order={query.data?.order}
            onCancelClick={props.onCancelClick}
            onEditAmountClick={props.onEditAmountClick}
            onResumeClick={props.onResumeClick}
            onUpdatePaymentMethodClick={props.onUpdatePaymentMethodClick}
            onMarkAsCompletedClick={props.onMarkAsCompletedClick}
            onMarkAsExpiredClick={props.onMarkAsExpiredClick}
          >
            <Button>More actions</Button>
          </ContributionContextualMenu>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

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

  return groups.map(group => ({
    group,
    transactions: byGroup[group]
      .filter(txn => txn.type === TransactionType.CREDIT)
      .sort((a, b) => {
        if (a.kind === TransactionKind.CONTRIBUTION && b.kind !== TransactionKind.CONTRIBUTION) {
          return -1;
        } else if (a.kind !== TransactionKind.CONTRIBUTION && b.kind === TransactionKind.CONTRIBUTION) {
          return 1;
        }
        return a.createdAt - b.createdAt;
      }),
  }));
}

function getTransactionsUrl(LoggedInUser: LoggedInUserType, order: ContributionDrawerQuery['order']): URL {
  let route = `/${order.toAccount.slug}/transactions`;
  if (LoggedInUser.isSelf(order.fromAccount)) {
    route = getDashboardRoute(order.fromAccount, 'transactions');
  } else if ('host' in order.toAccount && LoggedInUser.canSeeAdminPanel(order.toAccount.host)) {
    route = getDashboardRoute(order.toAccount.host, 'transactions');
  } else if (LoggedInUser.canSeeAdminPanel(order.toAccount)) {
    route = getDashboardRoute(order.toAccount, 'transactions');
  }

  return new URL(route, window.location.origin);
}

function getTransactionGroupLink(
  LoggedInUser: LoggedInUserType,
  order: ContributionDrawerQuery['order'],
  transactionGroup: string,
): string {
  const url = getTransactionsUrl(LoggedInUser, order);
  url.searchParams.set('group', transactionGroup);
  return url.toString();
}

function getTransactionOrderLink(LoggedInUser: LoggedInUserType, order: ContributionDrawerQuery['order']): string {
  const url = getTransactionsUrl(LoggedInUser, order);
  url.searchParams.set('order', order.legacyId.toString());
  return url.toString();
}

type OrderTimelineProps = {
  order: ContributionDrawerQuery['order'];
};

type OrderTimelineItem = {
  id: string;
  title: React.ReactNode;
  icon: React.ReactNode;
  date: string | Date;
  expected?: boolean;
  type?: 'error' | 'warning' | 'success' | 'info';
  collapsable?: boolean;
  collapseGroup?: string;
  normallyOpen?: boolean;
  menu?: React.ReactNode;
};

function OrderTimeline(props: OrderTimelineProps) {
  const { LoggedInUser } = useLoggedInUser();
  const [collapseGroupsToggle, setCollapseGroupsToggle] = useState({});

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
    .filter(a => {
      if (
        [
          ActivityType.COLLECTIVE_TRANSACTION_CREATED,
          ActivityType.ORDER_PENDING_CREATED,
          ActivityType.ORDER_PENDING_RECEIVED,
          ActivityType.ORDER_PENDING,
        ].includes(a.type)
      ) {
        return false;
      }

      return true;
    })
    .map(a => {
      return {
        id: a.id,
        title: <ActivityDescription activity={a} />,
        collapsable: a.type === ActivityType.PAYMENT_FAILED,
        icon: [
          ActivityType.PAYMENT_CREDITCARD_CONFIRMATION,
          ActivityType.ORDER_PAYMENT_FAILED,
          ActivityType.PAYMENT_FAILED,
          ActivityType.ORDER_PENDING_EXPIRED,
        ].includes(a.type) ? (
          <TriangleAlert size={16} />
        ) : a.type === ActivityType.SUBSCRIPTION_CANCELED ? (
          <CircleStop size={16} />
        ) : [ActivityType.ORDER_PROCESSING, ActivityType.ORDER_PENDING_CONTRIBUTION_REMINDER].includes(a.type) ? (
          <Hourglass size={16} />
        ) : (
          <Info size={16} />
        ),
        date: a.createdAt,
        type: [
          ActivityType.ORDER_PAYMENT_FAILED,
          ActivityType.SUBSCRIPTION_CANCELED,
          ActivityType.PAYMENT_FAILED,
          ActivityType.ORDER_PENDING_EXPIRED,
        ].includes(a.type)
          ? 'error'
          : [ActivityType.PAYMENT_CREDITCARD_CONFIRMATION, ActivityType.ORDER_PENDING_CONTRIBUTION_REMINDER].includes(
                a.type,
              )
            ? 'warning'
            : 'info',
        menu: a.data?.paymentProcessorUrl ? (
          <React.Fragment>
            <DropdownMenuItem>
              <Link href={a.data?.paymentProcessorUrl}>
                <FormattedMessage defaultMessage="View in payment processor" id="NgSLbI" />
              </Link>
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
      return {
        id: txn.group,
        title: txn.transactions.at(0).description,
        icon: <CircleCheckBig size={16} />,
        date: txn.transactions.at(0).createdAt,
        collapsable: true,
        type: 'success',
        normallyOpen: i === 0,
        menu: (
          <React.Fragment>
            <DropdownMenuItem>
              <Link href={getTransactionGroupLink(LoggedInUser, props.order, txn.group)}>
                <FormattedMessage defaultMessage="View transaction" id="1kZ3H0" />
              </Link>
            </DropdownMenuItem>
            {txn.transactions.at(0).paymentProcessorUrl && (
              <DropdownMenuItem>
                <Link href={txn.transactions.at(0).paymentProcessorUrl}>
                  <FormattedMessage defaultMessage="View in payment processor" id="NgSLbI" />
                </Link>
              </DropdownMenuItem>
            )}
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
    title: <FormattedMessage defaultMessage="Order created" id="XNf7EA" />,
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
              className={clsx('relative border-l pl-6 last:border-none last:pb-0', {
                'border-dashed': t.expected,
                'border-slate-500': t.type !== 'error',
                'border-red-500': t.type === 'error',
                'pb-20': t.expected && !isCollapsed,
                'pb-0': isCollapsed,
                'pb-10': !isCollapsed,
              })}
            >
              <div
                className={clsx('absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4', {
                  'bg-red-100 text-red-500 ring-red-100': t.type === 'error',
                  'bg-yellow-100 text-yellow-500 ring-yellow-100': t.type === 'warning',
                  'bg-green-100 text-green-500 ring-green-100': t.type === 'success',
                  'bg-blue-100 text-blue-500 ring-blue-100': t.type === 'info',
                })}
              >
                {t.icon}
              </div>
              <div
                className={clsx({
                  'border-t pt-4': t.collapsable && itemIndex !== 0,
                })}
              >
                <div className="text-xs">
                  <DateTime value={t.date} timeStyle="short" />
                </div>
                <div className="flex items-center">
                  <div>{t.title}</div>
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
              </div>
            </li>

            {isCollapsed && (
              <li
                className={clsx(
                  'relative border-l border-dotted border-slate-500 pb-10 pl-6 last:border-none last:pb-0',
                )}
              ></li>
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}
