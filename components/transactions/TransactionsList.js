import React from 'react';
import styled, { css } from 'styled-components';

import StyledCard from '../StyledCard';

import TransactionItem from './TransactionItem';

const Container = styled.div`
  ${props =>
    !props.isFirst &&
    css`
      border-top: 1px solid #e6e8eb;
    `}
`;

const TransactionsList = ({ transactions, collective, displayActions, onMutationSuccess }) => {
  if (!transactions?.length) {
    return null;
  }

  return (
    <StyledCard>
      {transactions.map((transaction, idx) => {
        return (
          <Container key={transaction?.id || idx} isFirst={!idx} data-cy="single-transaction">
            <TransactionItem
              transaction={transaction}
              collective={collective}
              displayActions={displayActions}
              onMutationSuccess={onMutationSuccess}
            />
          </Container>
        );
      })}
    </StyledCard>
  );
};

export default TransactionsList;
