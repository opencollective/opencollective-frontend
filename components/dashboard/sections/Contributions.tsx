import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { compact, isNil, mapValues, omitBy, pick, toNumber } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import Avatar from '../../Avatar';
import Container from '../../Container';
import { DataTable } from '../../DataTable';
import DateTime from '../../DateTime';
import EditOrderModal, { EditOrderActions } from '../../EditOrderModal';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import { Box } from '../../Grid';
import LinkCollective from '../../LinkCollective';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import OrderStatusTag from '../../orders/OrderStatusTag';
import PaymentMethodTypeWithIcon from '../../PaymentMethodTypeWithIcon';
import { managedOrderFragment } from '../../recurring-contributions/graphql/queries';
import SearchBar from '../../SearchBar';
import StyledTabs from '../../StyledTabs';
import { Span } from '../../Text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/DropdownMenu';
import { Pagination } from '../../ui/Pagination';
import { TableActionsButton } from '../../ui/Table';
import { AdminSectionProps } from '../types';

enum ContributionsTab {
  RECURRING = 'RECURRING',
  ONETIME = 'ONETIME',
  CANCELED = 'CANCELED',
}

const VIEWS = {
  RECURRING: {
    onlyActiveSubscriptions: true,
    includeIncognito: true,
  },
  ONETIME: {
    includeIncognito: true,
    status: ['PAID'],
    frequency: 'ONETIME',
    minAmount: 1,
  },
  CANCELED: {
    includeIncognito: true,
    status: ['CANCELLED'],
    minAmount: 1,
  },
};

const dashboardContributionsMetadataQuery = gql`
  query DashboardRecurringMetadataContributions($slug: String!, $filter: AccountOrdersFilter!) {
    account(slug: $slug) {
      id
      legacyId
      slug
      name
      type
      settings
      imageUrl
      ... on AccountWithParent {
        parent {
          id
          slug
        }
      }
      RECURRING: orders(filter: $filter, onlyActiveSubscriptions: true, includeIncognito: true) {
        totalCount
      }
      ONETIME: orders(filter: $filter, frequency: ONETIME, status: [PAID], includeIncognito: true, minAmount: 1) {
        totalCount
      }
      CANCELED: orders(filter: $filter, status: [CANCELLED], includeIncognito: true) {
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
    $onlyActiveSubscriptions: Boolean
    $includeIncognito: Boolean
    $minAmount: Int
  ) {
    account(slug: $slug) {
      id
      orders(
        filter: $filter
        frequency: $frequency
        status: $status
        onlyActiveSubscriptions: $onlyActiveSubscriptions
        includeIncognito: $includeIncognito
        minAmount: $minAmount
        searchTerm: $searchTerm
        offset: $offset
        limit: $limit
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

const getColumns = ({ tab, setEditOrder, intl, isIncoming }) => {
  const toAccount = {
    accessorKey: 'toAccount',
    header: intl.formatMessage({ id: 'Collective', defaultMessage: 'Collective' }),
    cell: ({ cell }) => {
      const toAccount = cell.getValue();
      return (
        <LinkCollective collective={toAccount} className="hover:underline">
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
        <LinkCollective collective={fromAccount} className="hover:underline">
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
  };
  const paymentMethod = {
    accessorKey: 'paymentMethod',
    header: intl.formatMessage({ id: 'paymentmethod.label', defaultMessage: 'Payment Method' }),
    cell: ({ cell }) => {
      const pm = cell.getValue();
      if (pm) {
        return (
          <div className="flex items-center gap-2 truncate">
            <PaymentMethodTypeWithIcon iconSize={18} type={pm.type} />
          </div>
        );
      }
    },
  };
  const status = {
    accessorKey: 'status',
    header: intl.formatMessage({ id: 'order.status', defaultMessage: 'Status' }),
    cell: ({ cell }) => {
      const status = cell.getValue();
      return (
        <div>
          <OrderStatusTag status={status} />
        </div>
      );
    },
  };

  if (tab === ContributionsTab.ONETIME) {
    return [
      isIncoming ? fromAccount : toAccount,
      orderId,
      paymentMethod,
      {
        accessorKey: 'amount',
        header: intl.formatMessage({ id: 'Fields.amount', defaultMessage: 'Amount' }),
        cell: ({ cell }) => {
          const amount = cell.getValue();
          return (
            <div className="flex items-center gap-2 truncate">
              <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} />
            </div>
          );
        },
      },
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
      status,
    ];
  } else if ([ContributionsTab.RECURRING, ContributionsTab.CANCELED].includes(tab)) {
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
    const totalDonations = {
      accessorKey: 'totalDonations',
      header: intl.formatMessage({ id: 'TotalDonated', defaultMessage: 'Total Donated' }),
      cell: ({ cell }) => {
        const amount = cell.getValue();
        return (
          <div className="flex items-center gap-2 truncate">
            <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} />
          </div>
        );
      },
    };
    const processedAt = {
      accessorKey: 'processedAt',
      header: intl.formatMessage({ id: 'LastCharge', defaultMessage: 'Last Charge' }),
      cell: ({ cell }) => {
        const date = cell.getValue();
        if (date) {
          return (
            <div className="flex items-center gap-2 truncate">
              <DateTime value={date} dateStyle="medium" timeStyle={undefined} />
            </div>
          );
        }
      },
    };

    if (tab === ContributionsTab.RECURRING) {
      const actions = {
        accessorKey: 'actions',
        header: null,
        meta: { className: 'flex justify-end' },
        cell: ({ row }) => {
          const order = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TableActionsButton />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOrder({ order, action: 'editPaymentMethod' })}>
                  <FormattedMessage id="subscription.menu.editPaymentMethod" defaultMessage="Update payment method" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditOrder({ order, action: 'editAmount' })}>
                  <FormattedMessage id="subscription.menu.updateAmount" defaultMessage="Update amount" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => setEditOrder({ order, action: 'cancel' })}>
                  <FormattedMessage id="subscription.menu.cancelContribution" defaultMessage="Cancel contribution" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      };
      return compact([
        isIncoming ? fromAccount : toAccount,
        orderId,
        paymentMethod,
        amount,
        totalDonations,
        processedAt,
        status,
        isIncoming ? null : actions,
      ]);
    } else {
      return [
        isIncoming ? fromAccount : toAccount,
        orderId,
        paymentMethod,
        amount,
        totalDonations,
        processedAt,
        status,
      ];
    }
  }
};

const PAGE_SIZE = 20;
const QUERY_FILTERS = ['searchTerm', 'offset'];
const QUERY_FORMATERS = {
  offset: toNumber,
};
const pickQueryFilters = query =>
  mapValues(omitBy(pick(query, QUERY_FILTERS), isNil), (value, key) =>
    QUERY_FORMATERS[key] ? QUERY_FORMATERS[key](value) : value,
  );

type ContributionsProps = AdminSectionProps & {
  direction?: 'INCOMING' | 'OUTGOING';
};

const Contributions = ({ account, direction }: ContributionsProps) => {
  const router = useRouter();
  const intl = useIntl();
  const [tab, setTab] = React.useState<ContributionsTab>(ContributionsTab.RECURRING);
  const queryValues = pickQueryFilters(router.query);
  const {
    data: metadata,
    loading: metadataLoading,
    error: metadataError,
  } = useQuery(dashboardContributionsMetadataQuery, {
    variables: {
      slug: account.slug,
      filter: direction || 'OUTGOING',
    },
    context: API_V2_CONTEXT,
  });
  const {
    data,
    previousData,
    loading: queryLoading,
    error: queryError,
  } = useQuery(dashboardContributionsQuery, {
    variables: {
      slug: account.slug,
      filter: direction || 'OUTGOING',
      limit: PAGE_SIZE,
      ...VIEWS[tab],
      ...queryValues,
    },
    context: API_V2_CONTEXT,
  });
  const [editOrder, setEditOrder] = React.useState<{ order?: { id: string }; action: EditOrderActions }>({
    order: null,
    action: null,
  });

  const tabs = [
    {
      id: ContributionsTab.RECURRING,
      label: 'Recurring',
      count: metadata?.account?.[ContributionsTab.RECURRING].totalCount,
    },
    {
      id: ContributionsTab.ONETIME,
      label: 'One-Time',
      count: metadata?.account?.[ContributionsTab.ONETIME].totalCount,
    },
    {
      id: ContributionsTab.CANCELED,
      label: 'Canceled',
      count: metadata?.account?.[ContributionsTab.CANCELED].totalCount,
    },
  ];

  const selectedOrders = data?.account?.orders.nodes || [];
  const pages = Math.ceil(((data || previousData)?.account?.orders.totalCount || 1) / PAGE_SIZE);
  const currentPage = toNumber((queryValues.offset || 0) + PAGE_SIZE) / PAGE_SIZE;
  const isIncoming = direction === 'INCOMING';
  const loading = metadataLoading || queryLoading;
  const error = metadataError || queryError;

  const updateFilters = props =>
    router.replace({ pathname: router.asPath.split('?')[0], query: pickQueryFilters({ ...router.query, ...props }) });
  const handleTabUpdate = tab => {
    setTab(tab);
    updateFilters({ offset: null });
  };
  const columns = getColumns({ tab, setEditOrder, intl, isIncoming });

  return (
    <Container>
      <div className="flex justify-between gap-4">
        <h1 className="text-2xl font-bold leading-10 tracking-tight">
          {isIncoming ? (
            <FormattedMessage id="Contributors" defaultMessage="Contributors" />
          ) : (
            <FormattedMessage id="Contributions" defaultMessage="Contributions" />
          )}
        </h1>
        <SearchBar
          placeholder={intl.formatMessage({ defaultMessage: 'Search...', id: 'search.placeholder' })}
          defaultValue={router.query.searchTerm}
          height="40px"
          onSubmit={searchTerm => updateFilters({ searchTerm, offset: null })}
        />
      </div>
      <Box my="24px">
        <StyledTabs tabs={tabs} selectedId={tab} onChange={handleTabUpdate} />
      </Box>
      <div className="flex flex-col gap-4">
        {error && <MessageBoxGraphqlError error={error} />}
        {loading && <LoadingPlaceholder height="250px" width="100%" borderRadius="16px" />}
        {!error && !loading && (
          <DataTable
            columns={columns}
            data={selectedOrders}
            mobileTableView
            emptyMessage={() => <FormattedMessage id="NoContributions" defaultMessage="No contributions" />}
          />
        )}
        <Pagination
          totalPages={pages}
          page={currentPage}
          onChange={page => updateFilters({ offset: (page - 1) * PAGE_SIZE })}
        />
      </div>
      {editOrder.order && (
        <EditOrderModal
          account={account}
          order={editOrder.order}
          action={editOrder.action}
          onClose={() => setEditOrder({ order: null, action: null })}
        />
      )}
    </Container>
  );
};

export default Contributions;
