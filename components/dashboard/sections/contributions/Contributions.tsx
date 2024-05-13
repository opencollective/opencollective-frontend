import React from 'react';
import { useMutation,useQuery  } from '@apollo/client';
import { compact } from 'lodash';
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { EMPTY_ARRAY } from '../../../../lib/constants/utils';
import { Views } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import { OrderStatus } from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { i18nPaymentMethodProviderType } from '../../../../lib/i18n/payment-method-provider-type';
import { PREVIEW_FEATURE_KEYS } from '../../../../lib/preview-features';

import Avatar from '../../../Avatar';
import ContributionConfirmationModal from '../../../ContributionConfirmationModal';
import { ContributionContextualMenu } from '../../../contributions/ContributionContextualMenu';
import { ContributionDrawer } from '../../../contributions/ContributionDrawer';
import DateTime from '../../../DateTime';
import EditOrderModal, { EditOrderActions } from '../../../EditOrderModal';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { useModal } from '../../../ModalContext';
import OrderStatusTag from '../../../orders/OrderStatusTag';
import PaymentMethodTypeWithIcon from '../../../PaymentMethodTypeWithIcon';
import { managedOrderFragment } from '../../../recurring-contributions/graphql/queries';
import { DataTable } from '../../../table/DataTable';
import { Span } from '../../../Text';
import { Button } from '../../../ui/Button';
import { TableActionsButton } from '../../../ui/Table';
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

const getColumns = ({ tab, contextualMenuProps, intl, isIncoming, includeHostedAccounts, onlyExpectedFunds }) => {
  const toAccount = {
    accessorKey: 'toAccount',
    header: intl.formatMessage({ id: 'Collective', defaultMessage: 'Collective' }),
    cell: ({ cell }) => {
      const toAccount = cell.getValue();
      return (
        <LinkCollective collective={toAccount} className="hover:underline" withHoverCard>
          <div className="flex max-w-[200px] items-center">
            <Avatar size={24} collective={toAccount} mr={2} />
            <Span as="span" truncateOverflow>
              {toAccount.name}
            </Span>
          </div>
        </LinkCollective>
      );
    },
  };
  const fromAccount = {
    accessorKey: 'fromAccount',
    header: intl.formatMessage({ id: 'Contributor', defaultMessage: 'Contributor' }),
    cell: ({ cell }) => {
      const fromAccount = cell.getValue();
      return (
        <LinkCollective collective={fromAccount} className="hover:underline" withHoverCard>
          <div className="flex max-w-[200px] items-center">
            <Avatar size={24} collective={fromAccount} mr={2} />
            <Span as="span" truncateOverflow>
              {fromAccount.name}
            </Span>
          </div>
        </LinkCollective>
      );
    },
  };
  const orderId = {
    accessorKey: 'legacyId',
    header: intl.formatMessage({ id: 'order.id', defaultMessage: 'Contribution #' }),
    meta: { className: 'text-center' },
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

  const actions = {
    accessorKey: 'actions',
    header: null,
    meta: { className: 'flex justify-end items-center' },
    cell: ({ row }) => {
      const order = row.original;

      return (
        <ContributionContextualMenu order={order} {...contextualMenuProps}>
          <TableActionsButton data-cy="contribution-admin-menu-trigger" />
        </ContributionContextualMenu>
      );
    },
  };

  if (!tab || [ContributionsTab.ONETIME, ContributionsTab.ALL].includes(tab)) {
    return compact([
      includeHostedAccounts ? toAccount : isIncoming ? fromAccount : toAccount,
      orderId,
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
      actions,
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
      includeHostedAccounts ? toAccount : isIncoming ? fromAccount : toAccount,
      orderId,
      paymentMethod,
      amount,
      totalAmount,
      status,
      actions,
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

  const contextualMenuProps = {
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
  };

  const columns = getColumns({
    tab: queryFilter.activeViewId,
    contextualMenuProps,
    intl,
    isIncoming,
    includeHostedAccounts,
    onlyExpectedFunds,
  });
  const currentViewCount = views.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders = currentViewCount < queryFilter.values.limit ? currentViewCount : queryFilter.values.limit;
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
      {LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DASHBOARD_CONTRIBUTION_DETAILS) && (
        <ContributionDrawer
          open={!!selectedContributionId}
          onClose={() => onToogleOrderDrawer(null)}
          orderId={selectedContributionId}
          orderUrl={orderUrl}
          {...contextualMenuProps}
        />
      )}
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

export default Contributions;
