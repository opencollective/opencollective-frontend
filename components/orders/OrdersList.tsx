import React from 'react';
import styled, { css } from 'styled-components';

import OrderBudgetItem from '../budget/OrderBudgetItem';
import StyledCard from '../StyledCard';

const OrderContainer = styled.div<{ isFirst?: boolean }>`
  ${props =>
    !props.isFirst &&
    css`
      border-top: 1px solid #e6e8eb;
    `}
`;

type OrdersListProps = {
  orders?: Array<{ id?: number | string; status?: string } & Record<string, unknown>>;
  isLoading?: boolean;
  nbPlaceholders?: number;
  showPlatformTip?: boolean;
  showAmountSign?: boolean;
  host?: Record<string, unknown>;
};

const OrdersList = ({
  orders,
  isLoading,
  nbPlaceholders = 10,
  showPlatformTip,
  showAmountSign,
  host,
}: OrdersListProps) => {
  orders = !isLoading ? orders : [...new Array(nbPlaceholders)];
  if (!orders?.length) {
    return null;
  }

  return (
    <StyledCard>
      {orders.map((order, idx) => (
        <OrderContainer key={order?.id || idx} isFirst={!idx} data-cy={`order-${order?.status}`}>
          <OrderBudgetItem
            isLoading={isLoading}
            order={order}
            showPlatformTip={showPlatformTip}
            showAmountSign={showAmountSign}
            host={host}
          />
        </OrderContainer>
      ))}
    </StyledCard>
  );
};

export default OrdersList;
