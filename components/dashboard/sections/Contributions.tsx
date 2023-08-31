import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { BREAKPOINTS, useWindowResize } from '../../../lib/hooks/useWindowResize';

import Avatar from '../../Avatar';
import Container from '../../Container';
import { DataTable } from '../../DataTable';
import DateTime from '../../DateTime';
import EditOrderModal, { EditOrderActions } from '../../EditOrderModal';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import { Box, Flex } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import OrderStatusTag from '../../orders/OrderStatusTag';
import PaymentMethodTypeWithIcon from '../../PaymentMethodTypeWithIcon';
import { managedOrderFragment } from '../../recurring-contributions/graphql/queries';
import StyledButton from '../../StyledButton';
import StyledTabs from '../../StyledTabs';
import { H1, P, Span } from '../../Text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/Dropdown';
import { TableActionsButton } from '../../ui/Table';
import { AdminSectionProps } from '../types';

const manageContributionsQuery = gql`
  query DashboardRecurringContributions($slug: String!) {
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
      recurring: orders(filter: OUTGOING, onlyActiveSubscriptions: true, includeIncognito: true) {
        totalCount
        nodes {
          id
          ...ManagedOrderFields
        }
      }
      oneTime: orders(filter: OUTGOING, frequency: ONETIME, status: [PAID], includeIncognito: true, minAmount: 1) {
        totalCount
        nodes {
          id
          ...ManagedOrderFields
        }
      }
      canceled: orders(filter: OUTGOING, status: [CANCELLED], includeIncognito: true) {
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

const getColumns = ({ tab, setEditOrder, intl }) => {
  const toAccount = {
    accessorKey: 'toAccount',
    header: intl.formatMessage({ id: 'Collective', defaultMessage: 'Collective' }),
    cell: ({ cell }) => {
      const toAccount = cell.getValue();
      return (
        <Flex alignItems="center" maxWidth="200px">
          <Avatar size={24} collective={toAccount} mr={2} />
          <Span as="span" truncateOverflow>
            {toAccount.name}
          </Span>
        </Flex>
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
        return <PaymentMethodTypeWithIcon iconSize={18} type={pm.type} />;
      }
    },
  };
  const status = {
    accessorKey: 'status',
    header: intl.formatMessage({ id: 'order.status', defaultMessage: 'Status' }),
    cell: ({ cell }) => {
      const status = cell.getValue();
      return (
        <Flex>
          <OrderStatusTag status={status} />
        </Flex>
      );
    },
  };

  if (tab === 'oneTime') {
    return [
      toAccount,
      orderId,
      paymentMethod,
      {
        accessorKey: 'amount',
        header: intl.formatMessage({ id: 'Fields.amount', defaultMessage: 'Amount' }),
        cell: ({ cell }) => {
          const amount = cell.getValue();
          return <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} />;
        },
      },
      {
        accessorKey: 'createdAt',
        header: intl.formatMessage({ id: 'expense.incurredAt', defaultMessage: 'Date' }),
        cell: ({ cell }) => {
          const date = cell.getValue();
          return <DateTime value={date} dateStyle="medium" timeStyle={undefined} />;
        },
      },
      status,
    ];
  } else if (['recurring', 'canceled'].includes(tab)) {
    const amount = {
      accessorKey: 'amount',
      header: intl.formatMessage({ id: 'Fields.amount', defaultMessage: 'Amount' }),
      cell: ({ cell, row }) => {
        const amount = cell.getValue();
        const order = row.original;
        return (
          <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} frequency={order.frequency} />
        );
      },
    };
    const totalDonations = {
      accessorKey: 'totalDonations',
      header: intl.formatMessage({ id: 'TotalDonated', defaultMessage: 'Total Donated' }),
      cell: ({ cell }) => {
        const amount = cell.getValue();
        return <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} />;
      },
    };
    const processedAt = {
      accessorKey: 'processedAt',
      header: intl.formatMessage({ id: 'LastCharge', defaultMessage: 'Last Charge' }),
      cell: ({ cell }) => {
        const date = cell.getValue();
        if (date) {
          return <DateTime value={date} dateStyle="medium" timeStyle={undefined} />;
        }
      },
    };

    if (tab === 'recurring') {
      return [
        toAccount,
        orderId,
        paymentMethod,
        amount,
        totalDonations,
        processedAt,
        status,
        {
          accessorKey: 'actions',
          meta: { className: 'flex justify-end' },
          header: null,
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
        },
      ];
    } else {
      return [toAccount, orderId, paymentMethod, amount, totalDonations, processedAt, status];
    }
  }
};

export const cardColumns = ({ tab, setEditOrder }) => [
  {
    accessorKey: 'summary',
    header: null,
    cell: ({ row }) => {
      const order = row.original;
      return (
        <Flex alignItems="center" gap="16px">
          <Avatar collective={order.toAccount} radius={40} />
          <Flex flexDirection="column" gap="8px" flexGrow={1}>
            <Flex justifyContent={['flex-start', 'space-between']} gap="8px" alignItems="baseline">
              <P fontSize="13px" fontWeight="400">
                <FormattedMessage id="order.id" defaultMessage="Contribution #" />
                {order.legacyId}
              </P>
              <Flex
                alignItems={['flex-end', 'center']}
                flexDirection={['column', 'row']}
                gap="16px"
                justifyContent={['space-between', 'flex-end']}
                flexGrow={1}
              >
                {order.frequency && order.processedAt && (
                  <P fontSize="13px" fontWeight="400" display={['none', 'block']}>
                    <FormattedMessage defaultMessage="Last charge" />
                    :&nbsp;
                    <DateTime value={order.processedAt} dateStyle="medium" timeStyle={undefined} />
                  </P>
                )}
                <OrderStatusTag status={order.status} />
                <P fontSize="16px">
                  <FormattedMoneyAmount
                    amount={order.amount.valueInCents}
                    currency={order.amount.currency}
                    frequency={order.frequency}
                  />
                </P>
              </Flex>
            </Flex>
            <Flex justifyContent="space-between" alignItems="baseline" flexDirection={['column', 'row']} gap="8px">
              <Flex fontSize="13px" fontWeight="400">
                {order.frequency && order.totalDonations && (
                  <Box mr="16px">
                    <FormattedMessage defaultMessage="Total contributed" />
                    :&nbsp;
                    <FormattedMoneyAmount
                      amount={order.totalDonations.valueInCents}
                      currency={order.totalDonations.currency}
                    />
                  </Box>
                )}
                {order.paymentMethod && <PaymentMethodTypeWithIcon iconSize={18} type={order.paymentMethod?.type} />}
              </Flex>
              <Flex justifyContent={['space-between', 'flex-end']} alignItems="baseline" width={['100%', 'auto']}>
                {order.frequency && order.processedAt && (
                  <P fontSize="13px" fontWeight="400" display={['block', 'none']}>
                    <FormattedMessage defaultMessage="Last charge" />
                    :&nbsp;
                    <DateTime value={order.processedAt} dateStyle="medium" timeStyle={undefined} />
                  </P>
                )}
                {tab === 'recurring' && (
                  <Flex justifyContent="center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <StyledButton data-cy="actions" buttonSize="tiny">
                          <FormattedMessage id="Edit" defaultMessage="Edit" />
                        </StyledButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditOrder({ order, action: 'editPaymentMethod' })}>
                          <FormattedMessage
                            id="subscription.menu.editPaymentMethod"
                            defaultMessage="Update payment method"
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditOrder({ order, action: 'editAmount' })}>
                          <FormattedMessage id="subscription.menu.updateAmount" defaultMessage="Update amount" />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setEditOrder({ order, action: 'cancel' })}
                        >
                          <FormattedMessage
                            id="subscription.menu.cancelContribution"
                            defaultMessage="Cancel contribution"
                          />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      );
    },
  },
];

const Home = ({ account }: AdminSectionProps) => {
  const { data, loading } = useQuery(manageContributionsQuery, {
    variables: { slug: account.slug },
    context: API_V2_CONTEXT,
  });
  const intl = useIntl();
  const [tab, setTab] = React.useState('recurring');
  const [view, setView] = React.useState<'table' | 'card'>('table');
  const [editOrder, setEditOrder] = React.useState<{ order?: { id: string }; action: EditOrderActions }>({
    order: null,
    action: null,
  });
  const error = false;

  const tabs = [
    { id: 'recurring', label: 'Recurring', count: data?.account?.recurring?.totalCount || undefined },
    { id: 'oneTime', label: 'One-Time', count: data?.account?.oneTime?.totalCount || undefined },
    { id: 'canceled', label: 'Canceled', count: data?.account?.canceled?.totalCount || undefined },
  ];

  useWindowResize(() => setView(window.innerWidth > BREAKPOINTS.LARGE ? 'table' : 'card'));

  const selectedOrders = data?.account?.[tab]?.nodes || [];
  const columns = view === 'table' ? getColumns({ tab, setEditOrder, intl }) : cardColumns({ tab, setEditOrder });

  return (
    <Container>
      <H1 fontSize="32px" lineHeight="40px" fontWeight="normal">
        <FormattedMessage id="Contributions" defaultMessage="Contributions" />
      </H1>
      <StyledTabs tabs={tabs} selectedId={tab} onChange={setTab} mt="24px" />
      <Flex flexDirection="column" mt="24px">
        {error && <MessageBoxGraphqlError error={error} />}
        {loading && <LoadingPlaceholder height="250px" width="100%" borderRadius="16px" />}
        {!error && !loading && (
          <DataTable fixedLayout={false} columns={columns} data={selectedOrders} hideHeader={view === 'card'} />
        )}
      </Flex>
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

export default Home;
