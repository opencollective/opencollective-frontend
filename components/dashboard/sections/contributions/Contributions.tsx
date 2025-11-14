import React, { useContext } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { compact, omit } from 'lodash';
import { ArrowLeftRightIcon, LinkIcon, Pencil, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import type { GetActions } from '../../../../lib/actions/types';
import { EMPTY_ARRAY } from '../../../../lib/constants/utils';
import type { Views } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import type { ContributionDrawerQuery, ManagedOrderFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import {
  ContributionFrequency,
  ExpectedFundsFilter,
  OrderStatus,
  PaymentMethodType,
} from '../../../../lib/graphql/types/v2/schema';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
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
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';

import { amount, beneficiary, contributionId, contributor, date, expectedAt, paymentMethod, status } from './columns';
import CreatePendingContributionModal from './CreatePendingOrderModal';
import type { FilterMeta } from './filters';
import { filters as allFilters, schema, toVariables } from './filters';
import { PausedIncomingContributionsMessage } from './PausedIncomingContributionsMessage';
import { FEATURES, requiresUpgrade } from '@/lib/allowed-features';
import { UpgradePlanCTA } from '@/components/platform-subscriptions/UpgradePlanCTA';

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
    $expectedFundsFilter: ExpectedFundsFilter
    $includeHostedAccounts: Boolean!
    $includeChildrenAccounts: Boolean
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
      childrenAccounts {
        totalCount
        nodes {
          id
          slug
          name
          ... on AccountWithContributions {
            tiers {
              nodes {
                id
                name
              }
            }
          }
        }
      }
      ... on AccountWithContributions {
        canStartResumeContributionsProcess
        hasResumeContributionsProcessStarted
        tiers {
          nodes {
            id
            name
          }
        }
      }
      ... on AccountWithParent {
        parent {
          id
          slug
          type
        }
      }
      ... on AccountWithHost {
        host {
          id
          slug
          name
          imageUrl
          type
          hostFeePercent
        }
      }

      PENDING: orders(
        filter: $filter
        expectedFundsFilter: $expectedFundsFilter
        status: [PENDING]
        includeHostedAccounts: $includeHostedAccounts
      ) @include(if: $onlyExpectedFunds) {
        totalCount
      }
      EXPIRED: orders(
        filter: $filter
        expectedFundsFilter: $expectedFundsFilter
        status: [EXPIRED]
        includeHostedAccounts: $includeHostedAccounts
      ) @include(if: $onlyExpectedFunds) {
        totalCount
      }
      RECURRING: orders(
        filter: $filter
        frequency: [MONTHLY, YEARLY]
        status: [ACTIVE, ERROR]
        includeIncognito: true
        includeHostedAccounts: $includeHostedAccounts
        includeChildrenAccounts: $includeChildrenAccounts
      ) @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      PAID: orders(
        filter: $filter
        includeIncognito: true
        status: [PAID]
        includeHostedAccounts: $includeHostedAccounts
        expectedFundsFilter: $expectedFundsFilter
      ) @include(if: $onlyExpectedFunds) {
        totalCount
      }
      ONETIME: orders(
        filter: $filter
        frequency: [ONETIME]
        status: [PAID, PROCESSING]
        includeIncognito: true
        minAmount: 1
        includeHostedAccounts: $includeHostedAccounts
        includeChildrenAccounts: $includeChildrenAccounts
      ) @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      CANCELED: orders(
        filter: $filter
        status: [CANCELLED]
        includeIncognito: true
        expectedFundsFilter: $expectedFundsFilter
        includeHostedAccounts: $includeHostedAccounts
        includeChildrenAccounts: $includeChildrenAccounts
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
      PAUSED_RESUMABLE: orders(
        filter: INCOMING
        status: [PAUSED]
        includeIncognito: true
        includeHostedAccounts: false
        includeChildrenAccounts: true
        pausedBy: [COLLECTIVE, HOST, PLATFORM]
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
    $frequency: [ContributionFrequency]
    $status: [OrderStatus!]
    $includeIncognito: Boolean
    $amount: AmountRangeInput
    $paymentMethod: [PaymentMethodReferenceInput]
    $includeHostedAccounts: Boolean!
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
        includeHostedAccounts: $includeHostedAccounts
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

const getColumns = ({ onlyExpectedFunds }) =>
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

const incomingContributionsFilters = omit(allFilters, ['expectedFundsFilter', 'expectedDate']);

const filters = omit(allFilters, ['expectedFundsFilter', 'expectedDate', 'tier']);

const expectedFundsFilters = omit(allFilters, ['tier']);

type ContributionsProps = DashboardSectionProps & {
  direction?: 'INCOMING' | 'OUTGOING';
  onlyExpectedFunds?: boolean;
  includeHostedAccounts?: boolean;
  includeChildrenAccounts?: boolean;
};

const Contributions = ({
  accountSlug,
  direction,
  onlyExpectedFunds,
  includeHostedAccounts,
  includeChildrenAccounts,
}: ContributionsProps) => {
  const { toast } = useToast();

  const { account } = useContext(DashboardContext);
  const isUpgradeRequired = onlyExpectedFunds && requiresUpgrade(account, FEATURES.EXPECTED_FUNDS);

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
  const [showCreatePendingOrderModal, setShowCreatePendingOrderModal] = React.useState(false);
  const [editingExpectedFunds, setEditingExpectedFunds] = React.useState(null);

  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const router = useRouter();
  const isIncoming = direction === 'INCOMING';
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
      expectedFundsFilter: onlyExpectedFunds ? ExpectedFundsFilter.ALL_EXPECTED_FUNDS : null,
      includeHostedAccounts: !!includeHostedAccounts,
      includeChildrenAccounts: !!includeChildrenAccounts,
    },
    context: API_V2_CONTEXT,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
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

  const views: Views<z.infer<typeof schema>> = [
    {
      id: ContributionsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {
        ...(onlyExpectedFunds ? { expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS } : {}),
      },
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
            frequency: [ContributionFrequency.MONTHLY, ContributionFrequency.YEARLY],
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
            frequency: [ContributionFrequency.ONETIME],
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
            expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
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
            expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
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
            expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
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
            ...(onlyExpectedFunds ? { expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS } : {}),
          },
        }
      : null,
  ].filter(Boolean);

  const tierOptions = React.useMemo(() => {
    if (!includeChildrenAccounts) {
      return [];
    }
    if (metadata?.account.childrenAccounts.nodes?.length === 0) {
      return metadata.account?.tiers?.nodes.map(tier => ({ label: tier.name, value: tier.id }));
    } else {
      const makeOption = account =>
        account?.tiers?.nodes.map(tier => ({ label: `${tier.name}  (${account.name})`, value: tier.id }));
      const options = makeOption(metadata?.account);
      metadata?.account.childrenAccounts.nodes.forEach(children => {
        options.push(...makeOption(children));
      });
      return options;
    }
  }, [metadata?.account]);

  const filterMeta: FilterMeta = {
    currency: metadata?.account?.currency,
    tierOptions: isIncoming ? tierOptions : [],
    childrenAccounts: account.childrenAccounts?.nodes ?? [],
    accountSlug: account.slug,
    showChildAccountFilter: direction === 'INCOMING' && !includeHostedAccounts && includeChildrenAccounts,
  };

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    meta: filterMeta,
    views,
    filters: onlyExpectedFunds
      ? expectedFundsFilters
      : isIncoming && !includeHostedAccounts
        ? incomingContributionsFilters
        : filters,
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
      includeHostedAccounts: !!includeHostedAccounts,
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
    skip: isUpgradeRequired,
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

  const loading = metadataLoading || queryLoading;
  const error = metadataError || queryError;

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
      <div className="flex max-w-(--breakpoint-lg) flex-col gap-4">
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
                  className="gap-1"
                  data-cy="create-pending-contribution"
                  disabled={isUpgradeRequired}
                >
                  <span>
                    <FormattedMessage defaultMessage="Create" id="create" />
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
        {isUpgradeRequired ? (
          <UpgradePlanCTA featureKey={FEATURES.EXPECTED_FUNDS} />
        ) : (
          <React.Fragment>
            <Filterbar {...queryFilter} />

            {isIncoming &&
              !onlyExpectedFunds &&
              metadata?.account?.canStartResumeContributionsProcess &&
              metadata?.account?.PAUSED_RESUMABLE.totalCount > 0 &&
              !metadata.account.parent && (
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
                <DataTable<ManagedOrderFieldsFragment, unknown>
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
                onSuccess={() => refetch()}
              />
            )}
            <Pagination queryFilter={queryFilter} total={data?.account?.orders.totalCount} />
          </React.Fragment>
        )}
      </div>
      <ContributionDrawer
        open={!!selectedContributionId}
        onClose={() => onToogleOrderDrawer(null)}
        orderId={selectedContributionId}
        getActions={getActions}
      />
      {confirmCompletedOrder && (
        <ContributionConfirmationModal
          order={confirmCompletedOrder}
          onClose={() => setConfirmCompletedOrder(false)}
          onSuccess={() => refetch()}
        />
      )}
      {editingExpectedFunds && (
        <CreatePendingContributionModal
          hostSlug={accountSlug}
          edit={editingExpectedFunds}
          onClose={() => setEditingExpectedFunds(null)}
          onSuccess={() => {
            refetch();
            refetchMetadata();
          }}
        />
      )}
    </React.Fragment>
  );
};

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

const getContributionActions: (
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

export default Contributions;
