import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { DotsHorizontalRounded } from '@styled-icons/boxicons-regular/DotsHorizontalRounded';
import { themeGet } from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import Avatar from '../../Avatar';
import Container from '../../Container';
import { DataTable } from '../../DataTable';
import DateTime from '../../DateTime';
import EditOrderModal, { EditOrderActions } from '../../EditOrderModal';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import { Flex } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import OrderStatusTag from '../../orders/OrderStatusTag';
import PaymentMethodTypeWithIcon from '../../PaymentMethodTypeWithIcon';
import PopupMenu from '../../PopupMenu';
import { managedOrderFragment } from '../../recurring-contributions/graphql/queries';
import StyledRoundButton from '../../StyledRoundButton';
import StyledTabs from '../../StyledTabs';
import { H1, Span } from '../../Text';
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
      oneTime: orders(
        filter: OUTGOING
        frequency: ONETIME
        status: [PAID, REQUIRE_CLIENT_CONFIRMATION, PROCESSING, IN_REVIEW, DISPUTED, PENDING, REFUNDED, ERROR]
        includeIncognito: true
      ) {
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

const ActionButton = styled.button`
  appearance: none;
  border: none;
  cursor: pointer;
  outline: 0;
  min-width: max-content;
  background: transparent;
  background-color: transparent;
  border: 0;
  padding: 8px 12px;
  margin: 0 8px;
  font-size: 13px;
  border-radius: 6px;
  white-space: nowrap;
  vertical-align: middle;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${props => props.color || props.theme.colors.black[800]};
  gap: 8px;
  cursor: pointer;
  &:hover {
    background-color: #f4f5f7;
    text-decoration: none;
    svg {
      color: #334155;
    }
  }

  svg {
    color: #94a3b8;
    height: 14px;
    width: 14px;
  }

  @media screen and (max-width: ${themeGet('breakpoints.0')}) {
    font-size: 16px;
    padding: 12px;

    svg {
      height: 16px;
      width: 16px;
    }
  }
`;

const getColumns = ({ tab, setEditOrder }) => {
  const toAccount = {
    accessorKey: 'toAccount',
    header: 'Collective',
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
    header: 'Order #',
  };
  const paymentMethod = {
    accessorKey: 'paymentMethod',
    header: 'Payment Method',
    cell: ({ cell }) => {
      const pm = cell.getValue();
      if (pm) {
        return <PaymentMethodTypeWithIcon iconSize={18} type={pm.type} />;
      }
    },
  };
  const status = {
    accessorKey: 'status',
    header: 'Status',
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
        header: 'Amount',
        cell: ({ cell }) => {
          const amount = cell.getValue();
          return <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} />;
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
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
      header: 'Amount',
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
      header: 'Total Donated',
      cell: ({ cell }) => {
        const amount = cell.getValue();
        return <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} />;
      },
    };
    const processedAt = {
      accessorKey: 'processedAt',
      header: 'Last Charge',
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
          header: 'Actions',
          cell: ({ row }) => {
            const order = row.original;
            return (
              <Flex justifyContent="center">
                <PopupMenu
                  placement="bottom-start"
                  Button={({ onClick }) => (
                    <StyledRoundButton data-cy="actions" size={32} onClick={onClick} buttonSize="small">
                      <DotsHorizontalRounded size="24px" color={themeGet('colors.black.600')} />
                    </StyledRoundButton>
                  )}
                >
                  {() => (
                    <Flex flexDirection="column">
                      <ActionButton onClick={() => setEditOrder({ order, action: 'editPaymentMethod' })}>
                        <FormattedMessage
                          id="subscription.menu.editPaymentMethod"
                          defaultMessage="Update payment method"
                        />
                      </ActionButton>
                      <ActionButton onClick={() => setEditOrder({ order, action: 'editAmount' })}>
                        <FormattedMessage id="subscription.menu.updateAmount" defaultMessage="Update amount" />
                      </ActionButton>
                      <ActionButton
                        onClick={() => setEditOrder({ order, action: 'cancel' })}
                        color={themeGet('colors.red.600')}
                      >
                        <FormattedMessage
                          id="subscription.menu.cancelContribution"
                          defaultMessage="Cancel contribution"
                        />
                      </ActionButton>
                    </Flex>
                  )}
                </PopupMenu>
              </Flex>
            );
          },
        },
      ];
    } else {
      return [toAccount, orderId, paymentMethod, amount, totalDonations, processedAt, status];
    }
  }
};

const TableWrapper = styled.div`
  > div {
    border-radius: 16px;
  }

  thead th {
    padding: 16px 0px;
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
    color: ${props => props.theme.colors.black[700]};
    :first-child {
      padding-left: 20px;
    }
    :last-child {
      padding-right: 20px;
    }
  }

  tbody tr td {
    font-size: 13px;
    padding: 16px 0px;
    color: ${props => props.theme.colors.black[800]};
    :first-child {
      padding-left: 20px;
    }
    :last-child {
      padding-right: 20px;
    }
  }
`;

const Contributions = ({ account }: AdminSectionProps) => {
  const { data, loading } = useQuery(manageContributionsQuery, {
    variables: { slug: account.slug },
    context: API_V2_CONTEXT,
  });
  const [tab, setTab] = React.useState('recurring');
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

  const selectedOrders = data?.account?.[tab]?.nodes || [];
  const columns = getColumns({ tab, setEditOrder });

  return (
    <Container flex={1} maxWidth={1024}>
      <H1 fontSize="24px" lineHeight="36px" fontWeight={700} color="black.900" letterSpacing="-.025em">
        <FormattedMessage id="Contributions" defaultMessage="Contributions" />
      </H1>
      <StyledTabs tabs={tabs} selectedId={tab} onChange={setTab} mt="24px" />
      <Flex flexDirection="column" mt="24px">
        {error && <MessageBoxGraphqlError error={error} />}
        {loading && <LoadingPlaceholder height="250px" width="100%" borderRadius="16px" />}
        {!error && !loading && (
          <TableWrapper>
            <DataTable columns={columns} data={selectedOrders} highlightRowOnHover={false} />
          </TableWrapper>
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

export default Contributions;
