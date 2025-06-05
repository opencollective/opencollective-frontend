import React from 'react';
import PropTypes from 'prop-types';

import { Span } from './Text';

const TransactionSign = ({ isCredit }) => {
  return (
    <Span
      data-cy="transaction-sign"
      color={isCredit ? 'green.700' : 'red.700'}
      mr={2}
      css={{ verticalAlign: 'text-bottom' }}
    >
      {isCredit ? '+' : '-'}
    </Span>
  );
};

TransactionSign.propTypes = {
  isCredit: PropTypes.bool,
};

export default TransactionSign;
