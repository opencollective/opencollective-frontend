import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Span } from '../Text';

/**
 * Displays the total amount for all the expense items.
 */
const ExpenseItemsTotalAmount = ({ items, currency }) => {
  const isValid = items.every(item => !isNil(item.amount));
  return (
    <Span color="black.500" fontSize="16px" letterSpacing={0} data-cy="expense-items-total-amount">
      {isValid ? (
        <FormattedMoneyAmount
          amount={items.reduce((amount, item) => amount + (item.amount || 0), 0)}
          precision={2}
          currency={currency}
          showCurrencyCode={false}
        />
      ) : (
        '--.--'
      )}
    </Span>
  );
};

ExpenseItemsTotalAmount.propTypes = {
  /** The currency of the collective */
  currency: PropTypes.string.isRequired,
  /** Expense items */
  items: PropTypes.arrayOf(
    PropTypes.shape({
      amount: PropTypes.number,
    }),
  ).isRequired,
};

export default ExpenseItemsTotalAmount;
