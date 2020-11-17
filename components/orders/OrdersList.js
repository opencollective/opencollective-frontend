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

const OrdersList = ({ orders, isLoading, nbPlaceholders }) => {
  orders = !isLoading ? orders : [...new Array(nbPlaceholders)];
  if (!orders?.length) {
    return null;
  }

  return (
    <StyledCard>
      {orders.map((order, idx) => (
        <OrderContainer key={order?.id || idx} isFirst={!idx} data-cy={`order-${order?.status}`}>
          <OrderBudgetItem isLoading={isLoading} order={order} />
        </OrderContainer>
      ))}
    </StyledCard>
  );
};

OrdersList.propTypes = {
  isLoading: PropTypes.bool,
  /** When `isLoading` is true, this sets the number of "loading" items displayed */
  nbPlaceholders: PropTypes.number,
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      legacyId: PropTypes.number.isRequired,
    }),
  ),
};

OrdersList.defaultProps = {
  nbPlaceholders: 10,
};

export default OrdersList;
