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
  Undo2,
  Wallet,
  X,
} from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../lib/actions/types';
import type { LoggedInUser as LoggedInUserType } from '../../lib/custom_typings/LoggedInUser';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type { ContributionDrawerQuery, ContributionDrawerQueryVariables } from '../../lib/graphql/types/v2/graphql';
import { ActivityType, ContributionFrequency, OrderStatus, TransactionKind } from '../../lib/graphql/types/v2/graphql';
import useClipboard from '../../lib/hooks/useClipboard';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { i18nPaymentMethodProviderType } from '../../lib/i18n/payment-method-provider-type';
import { getDashboardRoute } from '../../lib/url-helpers';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import ActivityDescription from '../dashboard/sections/ActivityLog/ActivityDescription';
import { useTransactionActions } from '../dashboard/sections/transactions/actions';
import DateTime from '../DateTime';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { OrderAdminAccountingCategoryPill } from '../orders/OrderAccountingCategoryPill';
import OrderStatusTag from '../orders/OrderStatusTag';
import PaymentMethodTypeWithIcon from '../PaymentMethodTypeWithIcon';
import { DropdownActionItem } from '../table/RowActionsMenu';
import Tags from '../Tags';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Sheet, SheetContent, SheetFooter } from '../ui/Sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

type ContributionDrawerProps = {
  open: boolean;
  onClose: () => void;
  orderId?: number;
  getActions: GetActions<ContributionDrawerQuery['order']>;
};

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
        isHost
        isArchived
        ... on Individual {
          isGuest
        }
        ... on AccountWithHost {
          host {
            id
            slug
            accountingCategories {
              nodes {
                id
                code
                name
                friendlyName
                kind
              }
            }
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
        legacyId
        uuid
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

  const actions = query.data?.order ? props.getActions(query.data.order) : null;

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
                  {isLoading ? null : (
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          onPointerDown={e => {
                            e.stopPropagation();
                          }}
                          onClick={e => {
                            const orderUrl = new URL(
                              `${query.data.order.toAccount.slug}/orders/${query.data.order.legacyId}`,
                              window.location.origin,
                            );

                            e.preventDefault();
                            e.stopPropagation();
                            clipboard.copy(orderUrl.toString());
                          }}
                        >
                          <div className="cursor-pointer">
                            <LinkIcon size={16} />
                          </div>
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
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {query.data?.order?.status && <OrderStatusTag status={query.data.order.status} />}
                  <Button variant="ghost" size="icon-sm" onClick={props.onClose}>
                    <X size={16} />
                  </Button>
                </div>
              </div>
              {query.data?.order?.permissions?.canUpdateAccountingCategory &&
                query.data.order.toAccount &&
                'host' in query.data.order.toAccount && (
                  <div className="mb-4">
                    <OrderAdminAccountingCategoryPill
                      order={query.data?.order}
                      account={query.data?.order.toAccount}
                      host={query.data.order.toAccount.host}
                    />
                  </div>
                )}
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
                <div className="mb-4 grid grid-cols-3 gap-4 gap-y-6 text-sm [&>*>*:first-child]:mb-2 [&>*>*:first-child]:font-bold [&>*>*:first-child]:text-[#344256]">
                  <div>
                    <div>
                      <FormattedMessage defaultMessage="Contributor" id="Contributor" />
                    </div>
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
                    <div>
                      <FormattedMessage defaultMessage="Collective" id="Collective" />
                    </div>
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
                    <div>
                      <FormattedMessage defaultMessage="Payment Method" id="paymentmethod.label" />
                    </div>
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
                      {query.data.order.pendingContributionData?.ponumber && (
                        <div className="col-span-3">
                          <div>
                            <FormattedMessage defaultMessage="PO Number" id="Fields.PONumber" />
                          </div>
                          <div>{query.data.order.pendingContributionData.ponumber}</div>
                        </div>
                      )}
                      {query.data.order.pendingContributionData?.fromAccountInfo && (
                        <div className="col-span-3">
                          <div>
                            <FormattedMessage defaultMessage="Contact" id="Contact" />
                          </div>
                          <div>
                            {query.data.order.pendingContributionData?.fromAccountInfo?.email
                              ? `${query.data.order.pendingContributionData.fromAccountInfo.name} (${query.data.order.pendingContributionData.fromAccountInfo.email})`
                              : query.data.order.pendingContributionData.fromAccountInfo.name}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  )}

                  <div className="col-span-3">
                    <div>
                      <FormattedMessage defaultMessage="Frequency" id="Frequency" />
                    </div>
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
                    <div>
                      <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
                    </div>
                    <div>
                      {isLoading ? (
                        <LoadingPlaceholder height={20} />
                      ) : (
                        <React.Fragment>
                          <div>
                            <FormattedMessage
                              defaultMessage="Contribution amount: {amount}"
                              id="y8CXGa"
                              values={{
                                amount: (
                                  <FormattedMoneyAmount
                                    showCurrencyCode={false}
                                    amountStyles={{ letterSpacing: 0 }}
                                    currency={query.data.order.totalAmount.currency}
                                    amount={query.data.order.totalAmount.valueInCents}
                                  />
                                ),
                              }}
                            />
                          </div>
                          {query.data.order.platformTipAmount?.valueInCents > 0 && (
                            <div>
                              <FormattedMessage
                                defaultMessage="Includes Platform Tip: {amount}"
                                id="g1BbRX"
                                values={{
                                  amount: (
                                    <FormattedMoneyAmount
                                      showCurrencyCode={false}
                                      amountStyles={{ letterSpacing: 0 }}
                                      currency={query.data.order.platformTipAmount.currency}
                                      amount={query.data.order.platformTipAmount.valueInCents}
                                    />
                                  ),
                                }}
                              />
                            </div>
                          )}
                        </React.Fragment>
                      )}
                    </div>
                  </div>

                  {query.data?.order?.memo ||
                    (query.data?.order?.pendingContributionData?.memo && (
                      <div>
                        <div>
                          <FormattedMessage defaultMessage="Memo" id="D5NqQO" />
                        </div>
                        <div>{query.data.order.memo || query.data.order.pendingContributionData.memo}</div>
                      </div>
                    ))}
                  {!isEmpty(query.data?.order?.customData) && (
                    <div>
                      <div>
                        <FormattedMessage defaultMessage="Custom Data" id="DRPEis" />
                      </div>
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
          {(actions?.primary.length > 0 || actions?.secondary.length > 0) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="xs">
                  <FormattedMessage defaultMessage="More actions" id="S8/4ZI" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions?.primary?.map(action => <DropdownActionItem key={action.key} action={action} />)}

                {actions?.primary.length > 0 && actions?.secondary.length > 0 && <DropdownMenuSeparator />}

                {actions?.secondary?.map(action => <DropdownActionItem key={action.key} action={action} />)}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
    transactions: byGroup[group].sort((a, b) => {
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
    route = getDashboardRoute(order.toAccount.host, 'host-transactions');
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
  url.searchParams.set('orderId', order.legacyId.toString());
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
          ActivityType.ORDER_DISPUTE_CREATED,
          ActivityType.ORDER_DISPUTE_CLOSED,
          ActivityType.CONTRIBUTION_REJECTED,
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
          // TODO: add disputed, in review
          ActivityType.ORDER_PAYMENT_FAILED,
          ActivityType.SUBSCRIPTION_CANCELED,
          ActivityType.PAYMENT_FAILED,
          ActivityType.ORDER_PENDING_EXPIRED,
          ActivityType.CONTRIBUTION_REJECTED,
        ].includes(a.type)
          ? 'error'
          : [
                ActivityType.PAYMENT_CREDITCARD_CONFIRMATION,
                ActivityType.ORDER_PENDING_CONTRIBUTION_REMINDER,
                ActivityType.ORDER_DISPUTE_CREATED,
                ActivityType.ORDER_DISPUTE_CLOSED,
              ].includes(a.type)
            ? 'warning'
            : 'info',
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

      return {
        id: txn.group,
        title: primaryTxn.description,
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
