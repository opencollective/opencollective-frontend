import React from 'react';
import { useMutation,useQuery  } from '@apollo/client';
import { compact } from 'lodash';
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { z } from 'zod';

import { GetActions } from '../../../../lib/actions/types';
import { EMPTY_ARRAY } from '../../../../lib/constants/utils';
import { LoggedInUser as LoggedInUserType } from '../../../../lib/custom_typings/LoggedInUser';
import { Views } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import { ContributionDrawerQuery, ContributionFrequency, OrderStatus } from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { i18nPaymentMethodProviderType } from '../../../../lib/i18n/payment-method-provider-type';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import ContributionConfirmationModal from '../../../ContributionConfirmationModal';
import { ContributionDrawer } from '../../../contributions/ContributionDrawer';
import DateTime from '../../../DateTime';
import EditOrderModal, { EditOrderActions } from '../../../EditOrderModal';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { useModal } from '../../../ModalContext';
import OrderStatusTag from '../../../orders/OrderStatusTag';
import PaymentMethodTypeWithIcon from '../../../PaymentMethodTypeWithIcon';
import { managedOrderFragment } from '../../../recurring-contributions/graphql/queries';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import { DashboardSectionProps } from '../../types';

import CreatePendingContributionModal from './CreatePendingOrderModal';
import { FilterMeta, filters, OrderTypeFilter, schema, toVariables } from './filters';
import { PausedIncomingContributionsMessage } from './PausedIncomingContributionsMessage';

enum ContributionsTab {
  ALL = 'ALL',
  RECURRING = 'RECURRING',
  ONETIME = 'ONETIME',
  PAUSED = 'PAUSED',
  CANCELED = 'CANCELED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  DISPUTED = 'DISPUTED',
  IN_REVIEW = 'IN_REVIEW',
}

const dashboardContributionsMetadataQuery = gql`
  query DashboardContributionsMetadata(
    $slug: String!
    $filter: AccountOrdersFilter!
    $onlyExpectedFunds: Boolean!
    $includeHostedAccounts: Boolean!
  ) {
    account(slug: $slug) {
      id
      legacyId
      slug
      name
      type
      settings
      imageUrl
      currency
      ... on AccountWithContributions {
        canStartResumeContributionsProcess
        hasResumeContributionsProcessStarted
      }
      ... on AccountWithParent {
        parent {
          id
          slug
          type
        }
      }
      ALL: orders(
        filter: $filter
        onlyExpectedFunds: $onlyExpectedFunds
        includeHostedAccounts: $includeHostedAccounts
      ) {
        totalCount
      }
      PENDING: orders(
        filter: $filter
        onlyExpectedFunds: $onlyExpectedFunds
        status: [PENDING]
        includeHostedAccounts: $includeHostedAccounts
      ) @include(if: $onlyExpectedFunds) {
        totalCount
      }
      EXPIRED: orders(
        filter: $filter
        onlyExpectedFunds: $onlyExpectedFunds
        status: [EXPIRED]
        includeHostedAccounts: $includeHostedAccounts
      ) @include(if: $onlyExpectedFunds) {
        totalCount
      }
      RECURRING: orders(
        filter: $filter
        onlyActiveSubscriptions: true
        includeIncognito: true
        includeHostedAccounts: $includeHostedAccounts
      ) @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      PAID: orders(
        filter: $filter
        includeIncognito: true
        status: [PAID]
        includeHostedAccounts: $includeHostedAccounts
        onlyExpectedFunds: $onlyExpectedFunds
      ) @include(if: $onlyExpectedFunds) {
        totalCount
      }
      ONETIME: orders(
        filter: $filter
        frequency: ONETIME
        status: [PAID, PROCESSING]
        includeIncognito: true
        minAmount: 1
        includeHostedAccounts: $includeHostedAccounts
      ) @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      CANCELED: orders(
        filter: $filter
        status: [CANCELLED]
        includeIncognito: true
        onlyExpectedFunds: $onlyExpectedFunds
        includeHostedAccounts: $includeHostedAccounts
      ) {
        totalCount
      }
      PAUSED: orders(
        filter: $filter
        status: [PAUSED]
        includeIncognito: true
        includeHostedAccounts: $includeHostedAccounts
      ) @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      DISPUTED: orders(
        filter: $filter
        status: [DISPUTED]
        includeIncognito: true
        includeHostedAccounts: $includeHostedAccounts
      ) @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      IN_REVIEW: orders(
        filter: $filter
        status: [IN_REVIEW]
        includeIncognito: true
        includeHostedAccounts: $includeHostedAccounts
      ) @skip(if: $onlyExpectedFunds) {
        totalCount
      }
    }
  }
`;

const dashboardContributionsQuery = gql`
  query DashboardRecurringContributions(
    $slug: String!
    $searchTerm: String
    $offset: Int
    $limit: Int
    $filter: AccountOrdersFilter!
    $frequency: ContributionFrequency
    $status: [OrderStatus!]
    $onlySubscriptions: Boolean
    $includeIncognito: Boolean
    $minAmount: Int
    $maxAmount: Int
    $paymentMethod: PaymentMethodReferenceInput
    $onlyExpectedFunds: Boolean!
    $includeHostedAccounts: Boolean!
    $dateFrom: DateTime
    $dateTo: DateTime
    $expectedDateFrom: DateTime
    $expectedDateTo: DateTime
    $expectedFundsFilter: ExpectedFundsFilter
  ) {
    account(slug: $slug) {
      id
      orders(
        dateFrom: $dateFrom
        dateTo: $dateTo
        expectedDateFrom: $expectedDateFrom
        expectedDateTo: $expectedDateTo
        filter: $filter
        frequency: $frequency
        status: $status
        onlySubscriptions: $onlySubscriptions
        includeIncognito: $includeIncognito
        minAmount: $minAmount
        maxAmount: $maxAmount
        searchTerm: $searchTerm
        offset: $offset
        limit: $limit
        paymentMethod: $paymentMethod
        onlyExpectedFunds: $onlyExpectedFunds
        includeHostedAccounts: $includeHostedAccounts
        expectedFundsFilter: $expectedFundsFilter
      ) {
        totalCount
        nodes {
          id
          ...ManagedOrderFields
        }
      }
    }
  }
  ${managedOrderFragment}
`;

const getColumns = ({ tab, intl, isIncoming, includeHostedAccounts, onlyExpectedFunds }) => {
  const accounts = {
    accessorKey: 'toAccount',
    header: intl.formatMessage({ defaultMessage: 'Collective & Contributors', id: 'kklCrk' }),
    meta: { className: 'max-w-[200px] overflow-hidden' },
    cell: ({ cell, row }) => {
      const toAccount = cell.getValue();
      const fromAccount = row.original.fromAccount;
      return (
        <div className="flex items-center gap-5">
          <div className="relative">
            <div>
              <AccountHoverCard
                account={toAccount}
                trigger={
                  <span>
                    <Avatar size={32} collective={toAccount} displayTitle={false} />
                  </span>
                }
              />
            </div>
            <div className="absolute -bottom-[6px] -right-[6px] rounded-full">
              <AccountHoverCard
                account={fromAccount}
                trigger={
                  <span>
                    <Avatar size={16} collective={fromAccount} displayTitle={false} />
                  </span>
                }
              />
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-5">
              {toAccount.slug || toAccount.name}
            </div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-4">
              {fromAccount.slug || fromAccount.name}
            </div>
          </div>
        </div>
      );
    },
  };

  const toAccount = {
    accessorKey: 'toAccount',
    header: intl.formatMessage({ id: 'Collective', defaultMessage: 'Collective' }),
    cell: ({ cell }) => {
      const toAccount = cell.getValue();
      return (
        <AccountHoverCard
          account={toAccount}
          trigger={
            <div className="flex items-center gap-2">
              <div>
                <Avatar size={32} collective={toAccount} displayTitle={false} />
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5">
                {toAccount.slug || toAccount.name}
              </div>
            </div>
          }
        />
      );
    },
  };
  const fromAccount = {
    accessorKey: 'fromAccount',
    header: intl.formatMessage({ id: 'Contributor', defaultMessage: 'Contributor' }),
    cell: ({ cell }) => {
      const fromAccount = cell.getValue();
      return (
        <AccountHoverCard
          account={fromAccount}
          trigger={
            <div className="flex items-center gap-2">
              <div>
                <Avatar size={32} collective={fromAccount} displayTitle={false} />
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5">
                {fromAccount.slug || fromAccount.name}
              </div>
            </div>
          }
        />
      );
    },
  };
  const paymentMethod = {
    accessorKey: 'paymentMethod',
    header: intl.formatMessage({ id: 'paymentmethod.label', defaultMessage: 'Payment Method' }),
    cell: ({ cell, row }) => {
      const pm = cell.getValue();
      if (pm) {
        return (
          <div className="flex items-center gap-2 truncate">
            <PaymentMethodTypeWithIcon iconSize={18} type={pm.type} />
          </div>
        );
      } else if (row.original?.pendingContributionData?.paymentMethod) {
        return i18nPaymentMethodProviderType(intl, row.original?.pendingContributionData?.paymentMethod);
      }
    },
  };
  const status = {
    accessorKey: 'status',
    header: intl.formatMessage({ id: 'order.status', defaultMessage: 'Status' }),
    cell: ({ cell }) => {
      const status = cell.getValue();
      return (
        <div data-cy="contribution-status">
          <OrderStatusTag status={status} />
        </div>
      );
    },
  };

  const totalAmount = {
    accessorKey: 'totalAmount',
    header: intl.formatMessage({ defaultMessage: 'Total Amount', id: 'CDTMW3' }),
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return (
        <div className="flex items-center gap-2 truncate">
          <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} />
        </div>
      );
    },
  };

  if (!tab || [ContributionsTab.ONETIME, ContributionsTab.ALL].includes(tab)) {
    return compact([
      includeHostedAccounts ? accounts : isIncoming ? fromAccount : toAccount,
      paymentMethod,
      totalAmount,
      {
        accessorKey: 'createdAt',
        header: intl.formatMessage({ id: 'expense.incurredAt', defaultMessage: 'Date' }),
        cell: ({ cell }) => {
          const date = cell.getValue();
          return (
            <div className="flex items-center gap-2 truncate">
              <DateTime value={date} dateStyle="medium" timeStyle={undefined} />
            </div>
          );
        },
      },
      onlyExpectedFunds
        ? {
            accessorKey: 'pendingContributionData.expectedAt',
            header: intl.formatMessage({ defaultMessage: 'Expected Date', id: 'vNC2dX' }),
            cell: ({ cell }) => {
              const date = cell.getValue();
              return (
                date && (
                  <div className="flex items-center gap-2 truncate">
                    <DateTime value={date} dateStyle="medium" timeStyle={undefined} />
                  </div>
                )
              );
            },
          }
        : null,
      status,
      actionsColumn,
    ]);
  } else {
    const amount = {
      accessorKey: 'amount',
      header: intl.formatMessage({ id: 'Fields.amount', defaultMessage: 'Amount' }),
      cell: ({ cell, row }) => {
        const amount = cell.getValue();
        const order = row.original;
        return (
          <div className="flex items-center gap-2 truncate">
            <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} frequency={order.frequency} />
          </div>
        );
      },
    };

    return compact([
      includeHostedAccounts ? accounts : isIncoming ? fromAccount : toAccount,
      paymentMethod,
      amount,
      totalAmount,
      status,
      actionsColumn,
    ]);
  }
};

type ContributionsProps = DashboardSectionProps & {
  direction?: 'INCOMING' | 'OUTGOING';
  onlyExpectedFunds?: boolean;
  includeHostedAccounts?: boolean;
};

const Contributions = ({ accountSlug, direction, onlyExpectedFunds, includeHostedAccounts }: ContributionsProps) => {
  const { toast } = useToast();

  const [expireOrder] = useMutation(
    gql`
      mutation ContributionsExpireOrder($orderId: Int) {
        processPendingOrder(order: { legacyId: $orderId }, action: MARK_AS_EXPIRED) {
          id
          status
          permissions {
            id
            canMarkAsPaid
            canMarkAsExpired
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
    },
  );

  const [confirmCompletedOrder, setConfirmCompletedOrder] = React.useState(null);
  const { showConfirmationModal } = useModal();
  const [showCreatePendingOrderModal, setShowCreatePendingOrderModal] = React.useState(false);

  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const router = useRouter();
  const {
    data: metadata,
    loading: metadataLoading,
    error: metadataError,
    refetch: refetchMetadata,
  } = useQuery(dashboardContributionsMetadataQuery, {
    variables: {
      slug: accountSlug,
      filter: direction || 'OUTGOING',
      onlyExpectedFunds: !!onlyExpectedFunds,
      includeHostedAccounts: !!includeHostedAccounts,
    },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
  });

  const selectedContributionId = router.query.orderId ? parseInt(router.query.orderId as string) : null;

  const onToogleOrderDrawer = React.useCallback(
    orderId => {
      const newUrl = new URL(router.asPath, window.location.origin);

      if (orderId) {
        newUrl.searchParams.set('orderId', orderId);
      } else {
        newUrl.searchParams.delete('orderId');
      }

      router.push(newUrl.toString(), undefined, { shallow: true });
    },
    [router],
  );

  const orderUrl = React.useMemo(() => {
    if (!selectedContributionId) {
      return null;
    }

    const url = new URL(router.asPath, window.location.origin);
    const keys = [];
    url.searchParams.forEach((value, key) => {
      keys.push(key);
    });
    keys.forEach(k => url.searchParams.delete(k));
    url.searchParams.set('orderId', selectedContributionId.toString());

    return url.toString();
  }, [selectedContributionId, router.asPath]);

  const views: Views<z.infer<typeof schema>> = [
    {
      id: ContributionsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      count: metadata?.account?.ALL.totalCount,
      filter: {},
    },
    !onlyExpectedFunds && includeHostedAccounts
      ? {
          id: ContributionsTab.DISPUTED,
          label: intl.formatMessage({ defaultMessage: 'Disputed', id: 'X1pwhF' }),
          count: metadata?.account?.[ContributionsTab.DISPUTED].totalCount,
          filter: {
            status: [OrderStatus.DISPUTED],
          },
        }
      : null,
    !onlyExpectedFunds && includeHostedAccounts
      ? {
          id: ContributionsTab.IN_REVIEW,
          label: intl.formatMessage({ id: 'order.in_review', defaultMessage: 'In Review' }),
          count: metadata?.account?.[ContributionsTab.IN_REVIEW].totalCount,
          filter: {
            status: [OrderStatus.IN_REVIEW],
          },
        }
      : null,
    !onlyExpectedFunds && !includeHostedAccounts
      ? {
          id: ContributionsTab.RECURRING,
          label: intl.formatMessage({ defaultMessage: 'Recurring', id: 'v84fNv' }),
          count: metadata?.account?.[ContributionsTab.RECURRING].totalCount,
          filter: {
            type: OrderTypeFilter.RECURRING,
            status: [OrderStatus.ACTIVE, OrderStatus.ERROR],
          },
        }
      : null,
    !onlyExpectedFunds && !includeHostedAccounts
      ? {
          id: ContributionsTab.ONETIME,
          label: intl.formatMessage({ defaultMessage: 'One-Time', id: 'jX0G5O' }),
          count: metadata?.account?.[ContributionsTab.ONETIME].totalCount,
          filter: {
            type: OrderTypeFilter.ONETIME,
            status: [OrderStatus.PAID, OrderStatus.PROCESSING],
          },
        }
      : null,
    !onlyExpectedFunds && metadata?.account?.[ContributionsTab.PAUSED].totalCount
      ? {
          id: ContributionsTab.PAUSED,
          label: intl.formatMessage({ id: 'order.paused', defaultMessage: 'Paused' }),
          count: metadata?.account?.[ContributionsTab.PAUSED].totalCount,
          filter: {
            status: [OrderStatus.PAUSED],
          },
        }
      : null,
    onlyExpectedFunds
      ? {
          id: ContributionsTab.PENDING,
          label: intl.formatMessage({ defaultMessage: 'Pending', id: 'eKEL/g' }),
          count: metadata?.account?.[ContributionsTab.PENDING].totalCount,
          filter: {
            status: [OrderStatus.PENDING],
          },
        }
      : null,
    onlyExpectedFunds
      ? {
          id: ContributionsTab.PAID,
          label: intl.formatMessage({ defaultMessage: 'Paid', id: 'u/vOPu' }),
          count: metadata?.account?.[ContributionsTab.PAID].totalCount,
          filter: {
            status: [OrderStatus.PAID],
          },
        }
      : null,
    onlyExpectedFunds
      ? {
          id: ContributionsTab.EXPIRED,
          label: intl.formatMessage({ defaultMessage: 'Expired', id: 'RahCRH' }),
          count: metadata?.account?.[ContributionsTab.EXPIRED].totalCount,
          filter: {
            status: [OrderStatus.EXPIRED],
          },
        }
      : null,
    !includeHostedAccounts || onlyExpectedFunds
      ? {
          id: ContributionsTab.CANCELED,
          label: intl.formatMessage({ defaultMessage: 'Cancelled', id: '3wsVWF' }),
          count: metadata?.account?.[ContributionsTab.CANCELED].totalCount,
          filter: {
            status: [OrderStatus.CANCELLED],
          },
        }
      : null,
  ].filter(Boolean);

  const filterMeta: FilterMeta = {
    currency: metadata?.account?.currency,
  };

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    meta: filterMeta,
    views,
    filters,
  });

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery(dashboardContributionsQuery, {
    variables: {
      slug: accountSlug,
      filter: direction || 'OUTGOING',
      includeIncognito: true,
      onlyExpectedFunds: !!onlyExpectedFunds,
      includeHostedAccounts: !!includeHostedAccounts,
      ...queryFilter.variables,
    },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
  });

  const [editOrder, setEditOrder] = React.useState<{ order?: { id: string | number }; action: EditOrderActions }>({
    order: router.query.orderId ? { id: router.query.orderId as string } : null,
    action: (router.query.action as EditOrderActions) ?? null,
  });

  const selectedOrders = data?.account?.orders.nodes || EMPTY_ARRAY;

  // If editOrderId is in URL, open it directly
  React.useEffect(() => {
    const rawResumeOrderId = router.query.resumeOrderId;
    const resumeOrderId = Array.isArray(rawResumeOrderId) ? rawResumeOrderId[0] : rawResumeOrderId;
    if (resumeOrderId) {
      const order = selectedOrders.find(o => o.legacyId === parseInt(resumeOrderId));
      if (order) {
        setEditOrder({ order, action: 'editPaymentMethod' });
        const [url, rawQuery] = router.asPath.split('?');
        const queryParams = new URLSearchParams(rawQuery);
        queryParams.delete('resumeOrderId');
        const newUrl = `${url}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        router.replace(newUrl, undefined, { shallow: true });
      }
    }
  }, [router, selectedOrders]);

  const isIncoming = direction === 'INCOMING';
  const loading = metadataLoading || queryLoading;
  const error = metadataError || queryError;

  const columns = getColumns({
    tab: queryFilter.activeViewId,
    intl,
    isIncoming,
    includeHostedAccounts,
    onlyExpectedFunds,
  });
  const currentViewCount = views.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders = currentViewCount < queryFilter.values.limit ? currentViewCount : queryFilter.values.limit;

  const getActions = getContributionActions({
    intl,
    LoggedInUser,
    onCancelClick: order => {
      setEditOrder({ order, action: 'cancel' });
    },
    onEditAmountClick: order => {
      setEditOrder({ order, action: 'editAmount' });
    },
    onResumeClick: order => {
      setEditOrder({ order, action: 'editPaymentMethod' });
    },
    onUpdatePaymentMethodClick: order => {
      setEditOrder({ order, action: 'editPaymentMethod' });
    },
    onMarkAsCompletedClick: order => {
      setConfirmCompletedOrder(order);
    },
    onMarkAsExpiredClick: order => {
      showConfirmationModal({
        title: <FormattedMessage id="Order.MarkExpiredConfirm" defaultMessage="Mark this contribution as expired?" />,
        description: (
          <FormattedMessage
            id="Order.MarkPaidExpiredDetails"
            defaultMessage="This contribution will be marked as expired removed from Pending Contributions. You can find this page by searching for its ID in the search bar or through the status filter in the Financial Contributions page."
          />
        ),
        onConfirm: async () => {
          await expireOrder({
            variables: {
              orderId: order.legacyId,
            },
          });
          toast({
            variant: 'success',
            message: intl.formatMessage({
              defaultMessage: 'The contribution has been marked as expired',
              id: '46L6cy',
            }),
          });
        },
        confirmLabel: <FormattedMessage id="order.markAsExpired" defaultMessage="Mark as expired" />,
      });
    },
  });

  return (
    <React.Fragment>
      <div className="flex max-w-screen-lg flex-col gap-4">
        <DashboardHeader
          title={
            isIncoming ? (
              onlyExpectedFunds ? (
                <FormattedMessage id="ExpectedFunds" defaultMessage="Expected Funds" />
              ) : includeHostedAccounts ? (
                <FormattedMessage id="FinancialContributions" defaultMessage="Financial Contributions" />
              ) : (
                <FormattedMessage id="IncomingContributions" defaultMessage="Incoming Contributions" />
              )
            ) : (
              <FormattedMessage id="OutgoingContributions" defaultMessage="Outgoing Contributions" />
            )
          }
          description={
            isIncoming ? (
              onlyExpectedFunds ? (
                includeHostedAccounts ? (
                  <FormattedMessage defaultMessage="Expected funds for Collectives you host." id="tNEw2N" />
                ) : (
                  <FormattedMessage id="ExpectedFunds.description" defaultMessage="Expected funds to your account" />
                )
              ) : includeHostedAccounts ? (
                <FormattedMessage defaultMessage="Contributions for Collectives you host." id="ZIZ7Ms" />
              ) : (
                <FormattedMessage
                  id="IncomingContributions.description"
                  defaultMessage="Contributions to your account."
                />
              )
            ) : (
              <FormattedMessage
                id="OutgoingContributions.description"
                defaultMessage="Manage your contributions to other Collectives."
              />
            )
          }
          actions={
            onlyExpectedFunds && includeHostedAccounts ? (
              <React.Fragment>
                <Button
                  size="sm"
                  onClick={() => setShowCreatePendingOrderModal(true)}
                  className="gap-1 "
                  data-cy="create-pending-contribution"
                >
                  <span>
                    <FormattedMessage defaultMessage="Create pending" id="clx/0D" />
                  </span>
                  <PlusIcon size={20} />
                </Button>
                {showCreatePendingOrderModal && (
                  <CreatePendingContributionModal
                    hostSlug={accountSlug}
                    onClose={() => setShowCreatePendingOrderModal(false)}
                    onSuccess={() => {
                      refetch();
                      refetchMetadata();
                    }}
                  />
                )}
              </React.Fragment>
            ) : null
          }
        />
        <Filterbar {...queryFilter} />

        {isIncoming && !onlyExpectedFunds && metadata?.account?.[ContributionsTab.PAUSED].totalCount > 0 && (
          <PausedIncomingContributionsMessage
            account={metadata.account}
            count={metadata.account[ContributionsTab.PAUSED].totalCount}
          />
        )}

        {error ? (
          <MessageBoxGraphqlError error={error} />
        ) : !loading && selectedOrders.length === 0 ? (
          <EmptyResults
            entityType="CONTRIBUTIONS"
            hasFilters={queryFilter.hasFilters}
            onResetFilters={() => queryFilter.resetFilters({})}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <DataTable
              loading={loading}
              columns={columns}
              data={selectedOrders}
              mobileTableView
              nbPlaceholders={nbPlaceholders}
              onClickRow={row => onToogleOrderDrawer(row.original.legacyId)}
              getActions={getActions}
            />
          </div>
        )}
        {editOrder.order && (
          <EditOrderModal
            accountSlug={accountSlug}
            order={editOrder.order}
            action={editOrder.action}
            onClose={() => setEditOrder({ order: null, action: null })}
          />
        )}
        <Pagination queryFilter={queryFilter} total={data?.account?.orders.totalCount} />
      </div>
      <ContributionDrawer
        open={!!selectedContributionId}
        onClose={() => onToogleOrderDrawer(null)}
        orderId={selectedContributionId}
        orderUrl={orderUrl}
        getActions={getActions}
      />
      {confirmCompletedOrder && (
        <ContributionConfirmationModal
          order={confirmCompletedOrder}
          onClose={() => setConfirmCompletedOrder(false)}
          onSuccess={() => {}}
        />
      )}
    </React.Fragment>
  );
};

type GetContributionActionsOptions = {
  LoggedInUser: LoggedInUserType;
  intl: IntlShape;
  onUpdatePaymentMethodClick: (order: ContributionDrawerQuery['order']) => void;
  onResumeClick: (order: ContributionDrawerQuery['order']) => void;
  onEditAmountClick: (order: ContributionDrawerQuery['order']) => void;
  onMarkAsCompletedClick: (order: ContributionDrawerQuery['order']) => void;
  onMarkAsExpiredClick: (order: ContributionDrawerQuery['order']) => void;
  onCancelClick: (order: ContributionDrawerQuery['order']) => void;
};

const getContributionActions: (opts: GetContributionActionsOptions) => GetActions<ContributionDrawerQuery['order']> =
  opts => order => {
    if (!order) {
      return null;
    }

    const actions: ReturnType<GetActions<any>> = {
      primary: [],
      secondary: [],
    };

    const isAdminOfOrder = opts.LoggedInUser.isAdminOfCollective(order.fromAccount);
    const canUpdateActiveOrder =
      order.frequency !== ContributionFrequency.ONETIME &&
      ![
        OrderStatus.PAUSED,
        OrderStatus.PROCESSING,
        OrderStatus.PENDING,
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED,
        OrderStatus.REJECTED,
      ].includes(order.status) &&
      isAdminOfOrder;

    const canResume = order.status === OrderStatus.PAUSED && order.permissions.canResume;
    const canCancel =
      isAdminOfOrder &&
      ![OrderStatus.CANCELLED, OrderStatus.PAID, OrderStatus.REFUNDED, OrderStatus.REJECTED].includes(order.status) &&
      order.frequency !== ContributionFrequency.ONETIME;
    const canMarkAsCompleted = order.status === OrderStatus.PENDING && order.permissions.canMarkAsPaid;
    const canMarkAsExpired = order.status === OrderStatus.PENDING && order.permissions.canMarkAsExpired;

    const canDoActions = [canUpdateActiveOrder, canResume, canCancel, canMarkAsCompleted, canMarkAsExpired];

    if (!canDoActions.some(Boolean)) {
      return null;
    }

    if (canUpdateActiveOrder) {
      actions.primary.push({
        label: opts.intl.formatMessage({ defaultMessage: 'Update payment method', id: 'subscription.menu.editPaymentMethod' }),
        onClick: () => opts.onUpdatePaymentMethodClick(order),
      });
    }

    if (canResume) {
      actions.primary.push({
        label: opts.intl.formatMessage({ defaultMessage: 'Resume contribution', id: '51nF6S', }),
        onClick: () => opts.onResumeClick(order),
      });
    }

    if (canUpdateActiveOrder) {
      actions.primary.push({
        label: opts.intl.formatMessage({ defaultMessage: 'Update amount', id: 'subscription.menu.updateAmount' }),
        onClick: () => opts.onEditAmountClick(order),
      });
    }

    if (canMarkAsCompleted) {
      actions.primary.push({
        label: opts.intl.formatMessage({ defaultMessage: 'Mark as completed', id: 'order.markAsCompleted' }),
        onClick: () => opts.onMarkAsCompletedClick(order),
      });
    }

    if (canMarkAsExpired) {
      actions.primary.push({
        label: opts.intl.formatMessage({ defaultMessage: 'Mark as expired', id: 'order.markAsExpired' }),
        onClick: () => opts.onMarkAsExpiredClick(order),
      });
    }

    if (canCancel) {
      actions.secondary.push({
        label: opts.intl.formatMessage({
          defaultMessage: 'Cancel contribution',
          id: 'subscription.menu.cancelContribution',
        }),
        onClick: () => opts.onCancelClick(order),
        'data-cy': 'recurring-contribution-menu-cancel-option',
      });
    }

    return actions;
  };

export default Contributions;
