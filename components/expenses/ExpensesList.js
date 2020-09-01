import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

import ExpenseBudgetItem from '../budget/ExpenseBudgetItem';
import StyledCard from '../StyledCard';

const ExpenseContainer = styled.div`
  ${props =>
    !props.isFirst &&
    css`
      border-top: 1px solid #e6e8eb;
    `}
`;

const ExpensesList = ({
  collective,
  host,
  usePreviewModal,
  expenses,
  isLoading,
  nbPlaceholders,
  isInverted,
  view,
  onDelete,
  onProcess,
}) => {
  expenses = !isLoading ? expenses : [...new Array(nbPlaceholders)];

  if (!expenses?.length) {
    return null;
  }

  return (
    <StyledCard>
      {expenses.map((expense, idx) => (
        <ExpenseContainer key={expense?.id || idx} isFirst={!idx} data-cy="single-expense">
          <ExpenseBudgetItem
            isLoading={isLoading}
            isInverted={isInverted}
            collective={collective || expense?.account}
            expense={expense}
            host={host}
            showProcessActions
            view={view}
            usePreviewModal={usePreviewModal}
            onDelete={onDelete}
            onProcess={onProcess}
          />
        </ExpenseContainer>
      ))}
    </StyledCard>
  );
};

ExpensesList.propTypes = {
  isLoading: PropTypes.bool,
  /** Set this to true to invert who's displayed (payee or collective) */
  isInverted: PropTypes.bool,
  /** When `isLoading` is true, this sets the number of "loadin" items displayed */
  nbPlaceholders: PropTypes.number,
  host: PropTypes.object,
  view: PropTypes.oneOf(['public', 'admin']),
  usePreviewModal: PropTypes.bool,
  onDelete: PropTypes.func,
  onProcess: PropTypes.func,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    parent: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
  }),
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      legacyId: PropTypes.number.isRequired,
    }),
  ),
};

ExpensesList.defaultProps = {
  nbPlaceholders: 10,
  view: 'public',
};

export default ExpensesList;
