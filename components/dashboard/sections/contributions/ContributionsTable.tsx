import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { compact } from 'lodash';
import { ArrowLeftRightIcon, LinkIcon, Pencil } from 'lucide-react';
import { useRouter } from 'next/router';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import { EMPTY_ARRAY } from '../../../../lib/constants/utils';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import type { ContributionDrawerQuery, ManagedOrderFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import {
  ContributionFrequency,
  ExpectedFundsFilter,
  OrderStatus,
  PaymentMethodType,
} from '../../../../lib/graphql/types/v2/schema';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import type { useQueryFilterReturnType } from '../../../../lib/hooks/useQueryFilter';
import type LoggedInUser from '../../../../lib/LoggedInUser';
import { getWebsiteUrl } from '../../../../lib/utils';

import ContributionConfirmationModal from '../../../ContributionConfirmationModal';
import { ContributionDrawer } from '../../../contributions/ContributionDrawer';
import { getTransactionsUrl } from '../../../contributions/ContributionTimeline';
import { CopyID } from '../../../CopyId';
import type { EditOrderActions } from '../../../EditOrderModal';
import EditOrderModal from '../../../EditOrderModal';
import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { useModal } from '../../../ModalContext';
import { managedOrderFragment } from '../../../recurring-contributions/graphql/queries';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import { useToast } from '../../../ui/useToast';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';

import { amount, beneficiary, contributionId, contributor, date, expectedAt, paymentMethod, status } from './columns';
import CreatePendingContributionModal from './CreatePendingOrderModal';

export const dashboardContributionsQuery = gql`
  query DashboardRecurringContributions(
    $slug: String!
    $searchTerm: String
    $offset: Int
    $limit: Int
    $filter: AccountOrdersFilter!
    $frequency: [ContributionFrequency]
    $status: [OrderStatus!]
    $includeIncognito: Boolean
    $amount: AmountRangeInput
    $paymentMethod: [PaymentMethodReferenceInput]
    $hostContext: HostContext
    $includeChildrenAccounts: Boolean
    $dateFrom: DateTime
    $dateTo: DateTime
    $expectedDateFrom: DateTime
    $expectedDateTo: DateTime
    $chargedDateFrom: DateTime
    $chargedDateTo: DateTime
    $expectedFundsFilter: ExpectedFundsFilter
    $orderBy: ChronologicalOrderInput
    $tier: [TierReferenceInput!]
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
        includeIncognito: $includeIncognito
        amount: $amount
        searchTerm: $searchTerm
        offset: $offset
        limit: $limit
        paymentMethod: $paymentMethod
        hostContext: $hostContext
        includeChildrenAccounts: $includeChildrenAccounts
        expectedFundsFilter: $expectedFundsFilter
        orderBy: $orderBy
        chargedDateFrom: $chargedDateFrom
        chargedDateTo: $chargedDateTo
        tier: $tier
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

export const getColumns = ({ onlyExpectedFunds }: { onlyExpectedFunds?: boolean }) =>
  compact([
    onlyExpectedFunds ? contributionId : null,
    !onlyExpectedFunds && contributor,
    beneficiary,
    amount,
    date,
    paymentMethod,
    onlyExpectedFunds ? expectedAt : null,
    status,
    actionsColumn,
  ]);

type GetContributionActionsOptions = {
  LoggedInUser: LoggedInUser;
  intl: IntlShape;
  onUpdatePaymentMethodClick: (order: ManagedOrderFieldsFragment | ContributionDrawerQuery['order']) => void;
  onResumeClick: (order: ManagedOrderFieldsFragment | ContributionDrawerQuery['order']) => void;
  onEditAmountClick: (order: ManagedOrderFieldsFragment | ContributionDrawerQuery['order']) => void;
  onMarkAsCompletedClick: (order: ManagedOrderFieldsFragment | ContributionDrawerQuery['order']) => void;
  onMarkAsExpiredClick: (order: ManagedOrderFieldsFragment | ContributionDrawerQuery['order']) => void;
  onCancelClick: (order: ManagedOrderFieldsFragment | ContributionDrawerQuery['order']) => void;
  onEditExpectedFundsClick: (order: ManagedOrderFieldsFragment | ContributionDrawerQuery['order']) => void;
  onEditAddedFundsClick: (order: ManagedOrderFieldsFragment | ContributionDrawerQuery['order']) => void;
};

export const getContributionActions: (
  opts: GetContributionActionsOptions,
) => GetActions<ManagedOrderFieldsFragment | ContributionDrawerQuery['order']> = opts => order => {
  if (!order) {
    return null;
  }

  const transactionsUrl = getTransactionsUrl(opts.LoggedInUser, order);
  transactionsUrl.searchParams.set('orderId', order.legacyId.toString());

  const actions: ReturnType<GetActions<any>> = {
    primary: [
      {
        key: 'view-transactions',
        label: (
          <Link href={transactionsUrl.toString()} className="flex flex-row items-center gap-2.5">
            <ArrowLeftRightIcon size={16} className="text-muted-foreground" />
            <FormattedMessage defaultMessage="View transactions" id="DfQJQ6" />
          </Link>
        ),
        onClick: () => {},
      },
    ],
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
  const canMarkAsCompleted =
    [OrderStatus.PENDING, OrderStatus.EXPIRED].includes(order.status) && order.permissions.canMarkAsPaid;
  const canMarkAsExpired = order.status === OrderStatus.PENDING && order.permissions.canMarkAsExpired;
  const isExpectedFunds = !!order.pendingContributionData?.expectedAt;

  if (canUpdateActiveOrder) {
    actions.primary.push({
      label: opts.intl.formatMessage({
        defaultMessage: 'Update payment method',
        id: 'subscription.menu.editPaymentMethod',
      }),
      onClick: () => opts.onUpdatePaymentMethodClick(order),
      key: 'update-payment-method',
    });
  }

  if (canResume) {
    actions.primary.push({
      label: opts.intl.formatMessage({ defaultMessage: 'Resume contribution', id: '51nF6S' }),
      onClick: () => opts.onResumeClick(order),
      key: 'resume-contribution',
    });
  }

  if (canUpdateActiveOrder) {
    actions.primary.push({
      label: opts.intl.formatMessage({ defaultMessage: 'Update amount', id: 'subscription.menu.updateAmount' }),
      onClick: () => opts.onEditAmountClick(order),
      key: 'update-amount',
    });
  }

  if (isExpectedFunds && (canMarkAsExpired || canMarkAsCompleted)) {
    actions.primary.push({
      label: opts.intl.formatMessage({ defaultMessage: 'Edit expected funds', id: 'hQAJH9' }),
      onClick: () => opts.onEditExpectedFundsClick(order),
      key: 'edit',
    });
  }

  if (canMarkAsCompleted) {
    actions.primary.push({
      label: opts.intl.formatMessage({ defaultMessage: 'Mark as completed', id: 'order.markAsCompleted' }),
      onClick: () => opts.onMarkAsCompletedClick(order),
      'data-cy': 'MARK_AS_PAID-button',
      key: 'mark-as-paid',
    });
  }

  if (canMarkAsExpired) {
    actions.primary.push({
      label: opts.intl.formatMessage({ defaultMessage: 'Mark as expired', id: 'order.markAsExpired' }),
      onClick: () => opts.onMarkAsExpiredClick(order),
      'data-cy': 'MARK_AS_EXPIRED-button',
      key: 'mark-as-expired',
    });
  }

  if (canCancel) {
    actions.secondary.push({
      key: 'cancel-contribution',
      label: opts.intl.formatMessage({
        defaultMessage: 'Cancel contribution',
        id: 'subscription.menu.cancelContribution',
      }),
      onClick: () => opts.onCancelClick(order),
      'data-cy': 'recurring-contribution-menu-cancel-option',
    });
  }

  if (order.paymentMethod?.type === PaymentMethodType.HOST) {
    actions.primary.push({
      key: 'edit-funds',
      label: (
        <React.Fragment>
          <Pencil size={16} className="text-muted-foreground" />
          {opts.intl.formatMessage({ defaultMessage: 'Edit funds', id: 'Kbjd3f' })}
        </React.Fragment>
      ),
      onClick: () => opts.onEditAddedFundsClick(order),
    });
  }

  const toAccount = order.toAccount;
  const legacyId = order.legacyId;
  const orderUrl = new URL(`${toAccount.slug}/orders/${legacyId}`, getWebsiteUrl());

  actions.secondary.push({
    key: 'copy-link',
    label: (
      <CopyID
        Icon={null}
        value={orderUrl}
        tooltipLabel={<FormattedMessage defaultMessage="Copy link" id="CopyLink" />}
        className=""
      >
        <div className="flex flex-row items-center gap-2.5">
          <LinkIcon size={16} className="text-muted-foreground" />
          <FormattedMessage defaultMessage="Copy link" id="CopyLink" />
        </div>
      </CopyID>
    ),
    onClick: () => {},
  });

  return actions;
};

export type ContributionsTableProps<FilterValues extends Record<string, unknown>> = {
  accountSlug: string;
  direction: 'INCOMING' | 'OUTGOING';
  queryFilter: useQueryFilterReturnType<any, any, any>;
  views: { id: string; label: string; filter: Partial<FilterValues>; count?: number }[];
  onlyExpectedFunds?: boolean;
  includeChildrenAccounts?: boolean;
  hostSlug?: string;
  emptyMessage?: React.ReactNode;
  onRefetch?: () => void;
};

export default function ContributionsTable<FilterValues extends Record<string, unknown>>({
  accountSlug,
  direction,
  queryFilter,
  views,
  onlyExpectedFunds,
  includeChildrenAccounts = true,
  hostSlug,
  onRefetch,
}: ContributionsTableProps<FilterValues>) {
  const { toast } = useToast();
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const router = useRouter();

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
          activities {
            nodes {
              id
            }
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
  const [editingExpectedFunds, setEditingExpectedFunds] = React.useState(null);

  const selectedContributionId = router.query.orderId ? parseInt(router.query.orderId as string) : null;

  const onToggleOrderDrawer = React.useCallback(
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

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery(dashboardContributionsQuery, {
    variables: {
      slug: accountSlug,
      filter: direction,
      includeIncognito: true,
      includeChildrenAccounts: !!includeChildrenAccounts,
      ...queryFilter.variables,
      ...(onlyExpectedFunds
        ? {
            expectedFundsFilter:
              (queryFilter.variables as any).expectedFundsFilter || ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
          }
        : { expectedFundsFilter: null }),
    },
    context: API_V2_CONTEXT,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const handleRefetch = React.useCallback(() => {
    refetch();
    onRefetch?.();
  }, [refetch, onRefetch]);

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

  const columns = getColumns({ onlyExpectedFunds });
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
            defaultMessage="This contribution will be marked as expired removed from Expected Funds. You can find this page by searching for its ID in the search bar or through the status filter in the Financial Contributions page."
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
    onEditExpectedFundsClick(order) {
      setEditingExpectedFunds(order);
    },
    onEditAddedFundsClick(order) {
      setEditOrder({ order, action: 'editAddedFunds' });
    },
  });

  return (
    <React.Fragment>
      <Filterbar {...queryFilter} views={views} />

      {queryError ? (
        <MessageBoxGraphqlError error={queryError} />
      ) : !queryLoading && selectedOrders.length === 0 ? (
        <EmptyResults
          entityType="CONTRIBUTIONS"
          hasFilters={queryFilter.hasFilters}
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <DataTable<ManagedOrderFieldsFragment, unknown>
            loading={queryLoading}
            columns={columns}
            data={selectedOrders}
            mobileTableView
            nbPlaceholders={nbPlaceholders}
            onClickRow={row => onToggleOrderDrawer(row.original.legacyId)}
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
          onSuccess={handleRefetch}
        />
      )}

      <Pagination queryFilter={queryFilter} total={data?.account?.orders.totalCount} />

      <ContributionDrawer
        open={!!selectedContributionId}
        onClose={() => onToggleOrderDrawer(null)}
        orderId={selectedContributionId}
        getActions={getActions}
      />

      {confirmCompletedOrder && (
        <ContributionConfirmationModal
          order={confirmCompletedOrder}
          onClose={() => setConfirmCompletedOrder(false)}
          onSuccess={handleRefetch}
        />
      )}

      {editingExpectedFunds && (
        <CreatePendingContributionModal
          hostSlug={hostSlug || accountSlug}
          edit={editingExpectedFunds}
          onClose={() => setEditingExpectedFunds(null)}
          onSuccess={handleRefetch}
        />
      )}
    </React.Fragment>
  );
}
