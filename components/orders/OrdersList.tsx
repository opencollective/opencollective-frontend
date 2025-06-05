import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

import OrderBudgetItem from '../budget/OrderBudgetItem';
import StyledCard from '../StyledCard';

const OrderContainer = styled.div`
  ${props =>
    !props.isFirst &&
    css`
      border-top: 1px solid #e6e8eb;
    `}
`;

const OrdersList = ({ orders, isLoading, nbPlaceholders = 10, showPlatformTip, showAmountSign, host }) => {
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

OrdersList.propTypes = {
  isLoading: PropTypes.bool,
  host: PropTypes.object,
  /** When `isLoading` is true, this sets the number of "loading" items displayed */
  nbPlaceholders: PropTypes.number,
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      legacyId: PropTypes.number.isRequired,
    }),
  ),
  showPlatformTip: PropTypes.bool,
  showAmountSign: PropTypes.bool,
};

export default OrdersList;
